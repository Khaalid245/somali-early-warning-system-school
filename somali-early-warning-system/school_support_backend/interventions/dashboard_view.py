from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Prefetch, Avg
from django.utils import timezone
from datetime import timedelta, date
from collections import defaultdict

from interventions.models import InterventionCase
from alerts.models import Alert
from students.models import Student
from attendance.models import AttendanceRecord
from interventions.serializers import InterventionCaseSerializer
from alerts.serializers import AlertSerializer
from interventions.ai_recommendations import get_ai_insights_for_student, get_classroom_ai_summary
from academics.models import Classroom
from students.models import StudentEnrollment
from risk.models import StudentRiskProfile
from attendance.attendance_utils import classify_day


class FormMasterDashboardView(APIView):
    """Optimized dashboard endpoint for Form Masters"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        print(f"Dashboard access attempt - User: {user.email}, Role: {user.role}")

        if user.role != 'form_master':
            print(f"Access denied - Expected 'form_master', got '{user.role}'")
            return Response({
                'error': 'Access denied. Only Form Masters can access this dashboard.',
                'user_role': user.role,
                'required_role': 'form_master'
            }, status=403)

        try:
            today = date.today()

            # ── Pending cases ──────────────────────────────────────────────
            pending_cases = InterventionCase.objects.select_related(
                'student__risk_profile', 'assigned_to', 'alert'
            ).prefetch_related(
                'student__enrollments__classroom'
            ).filter(
                assigned_to=user,
                status__in=['open', 'in_progress', 'escalated_to_admin']
            ).order_by('-created_at')[:20]

            # ── Urgent alerts ──────────────────────────────────────────────
            urgent_alerts = Alert.objects.select_related(
                'student', 'assigned_to', 'subject'
            ).filter(
                assigned_to=user,
                status__in=['active', 'pending', 'under_review']
            ).order_by('-alert_date')[:10]

            # ── High-risk students (form master's classroom only) ──────────
            high_risk_students = Student.objects.filter(
                is_active=True,
                risk_profile__isnull=False,
                enrollments__classroom__form_master=user,
                enrollments__is_active=True
            ).select_related(
                'risk_profile'
            ).prefetch_related(
                'enrollments__classroom'
            ).annotate(
                total_sessions=Count('attendance_records'),
                present_count=Count('attendance_records', filter=Q(attendance_records__status='present')),
                absent_count=Count('attendance_records', filter=Q(attendance_records__status='absent')),
                late_count=Count('attendance_records', filter=Q(attendance_records__status='late'))
            ).distinct().order_by('-risk_profile__risk_score')[:20]

            # ── Mark overdue cases ─────────────────────────────────────────
            pending_cases_list = list(pending_cases)
            for case in pending_cases_list:
                case.is_overdue = (
                    case.follow_up_date and
                    case.follow_up_date < today and
                    case.status != 'closed'
                )

            # ── Statistics & trends ────────────────────────────────────────
            last_month = timezone.now() - timedelta(days=30)
            prev_month = timezone.now() - timedelta(days=60)
            week_ago   = timezone.now() - timedelta(days=7)

            stats = InterventionCase.objects.filter(assigned_to=user).aggregate(
                total_cases=Count('case_id'),
                open_cases=Count('case_id', filter=Q(status='open')),
                in_progress=Count('case_id', filter=Q(status='in_progress')),
                closed_cases=Count('case_id', filter=Q(status='closed'))
            )

            last_month_stats = InterventionCase.objects.filter(
                assigned_to=user, created_at__gte=last_month
            ).aggregate(
                new_cases=Count('case_id'),
                closed_last_month=Count('case_id', filter=Q(status='closed', updated_at__gte=last_month))
            )

            prev_month_stats = InterventionCase.objects.filter(
                assigned_to=user,
                created_at__gte=prev_month,
                created_at__lt=last_month
            ).aggregate(prev_new_cases=Count('case_id'))

            new_cases_trend = 0
            if prev_month_stats['prev_new_cases'] > 0:
                new_cases_trend = int(
                    (last_month_stats['new_cases'] - prev_month_stats['prev_new_cases'])
                    / prev_month_stats['prev_new_cases'] * 100
                )

            recent_activity = InterventionCase.objects.filter(
                assigned_to=user, updated_at__gte=week_ago
            ).count()

            # ── Build high_risk_students response ─────────────────────────
            high_risk_students_data = []
            for s in high_risk_students:
                classroom_name = 'Not Enrolled'
                active_enrollment = s.enrollments.filter(is_active=True).first()
                if active_enrollment and active_enrollment.classroom:
                    classroom_name = active_enrollment.classroom.name

                risk_level = s.risk_profile.risk_level if s.risk_profile else 'low'

                high_risk_students_data.append({
                    'student__student_id': s.student_id,
                    'student__full_name': s.full_name,
                    'classroom': classroom_name,
                    'risk_level': risk_level,
                    'attendance_rate': int((s.present_count / s.total_sessions * 100) if s.total_sessions > 0 else 0),
                    'total_sessions': s.total_sessions,
                    'absent_count': s.absent_count,
                    'late_count': s.late_count,
                })

            # ── AI insights ────────────────────────────────────────────────
            ai_insights = []
            for student in high_risk_students[:5]:
                try:
                    ai_insights.append(get_ai_insights_for_student(student))
                except Exception as e:
                    print(f"AI insights error for student {student.student_id}: {str(e)}")

            classroom_summary = get_classroom_ai_summary(list(high_risk_students))

            # ── Case status breakdown (pie chart) ──────────────────────────
            case_status_breakdown = list(
                InterventionCase.objects.filter(assigned_to=user)
                .values('status')
                .annotate(count=Count('case_id'))
                .order_by('status')
            )

            # ── Students in form master's classroom (needed for absence trend) ───
            fm_student_ids = Student.objects.filter(
                enrollments__classroom__form_master=user,
                enrollments__is_active=True
            ).values_list('student_id', flat=True)

            # ── Monthly alert trend (last 6 months) ──────────────────────
            monthly_alert_trend = []
            for i in range(5, -1, -1):
                month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
                if i == 0:
                    month_end = today
                else:
                    month_end = (month_start + timedelta(days=32)).replace(day=1)
                count = Alert.objects.filter(
                    assigned_to=user,
                    alert_date__gte=month_start,
                    alert_date__lt=month_end,
                ).count()
                monthly_alert_trend.append({
                    'month': month_start.strftime('%Y-%m'),
                    'count': count
                })

            # ── Monthly case trend (last 6 months) ────────────────────────
            monthly_case_trend = []
            for i in range(5, -1, -1):
                month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
                if i == 0:
                    month_end = today
                else:
                    month_end = (month_start + timedelta(days=32)).replace(day=1)
                count = InterventionCase.objects.filter(
                    assigned_to=user,
                    created_at__date__gte=month_start,
                    created_at__date__lt=month_end,
                ).count()
                monthly_case_trend.append({
                    'month': month_start.strftime('%Y-%m'),
                    'count': count
                })

            # ── Absence trend: last 6 weeks (bar chart) ────────────────────
            absence_trend_data = []
            for i in range(5, -1, -1):
                week_start = today - timedelta(days=(i + 1) * 7)
                week_end   = today - timedelta(days=i * 7)
                count = AttendanceRecord.objects.filter(
                    student_id__in=fm_student_ids,
                    session__attendance_date__gte=week_start,
                    session__attendance_date__lt=week_end,
                    status='absent'
                ).count()
                label = 'This Week' if i == 0 else f'Week -{i}'
                absence_trend_data.append({'period': label, 'absences': count})

            # ── Response ───────────────────────────────────────────────────
            return Response({
                'pending_cases': [{
                    **InterventionCaseSerializer(case).data,
                    'is_overdue': getattr(case, 'is_overdue', False)
                } for case in pending_cases_list],
                'urgent_alerts': AlertSerializer(urgent_alerts, many=True).data,
                'high_risk_students': high_risk_students_data,
                'ai_insights': ai_insights,
                'classroom_summary': classroom_summary,
                'case_status_breakdown': case_status_breakdown,
                'absence_trend': absence_trend_data,
                'monthly_alert_trend': monthly_alert_trend,
                'monthly_case_trend': monthly_case_trend,
                'statistics': {
                    'total_cases':   stats['total_cases']   or 0,
                    'open_cases':    stats['open_cases']    or 0,
                    'in_progress':   stats['in_progress']   or 0,
                    'closed_cases':  stats['closed_cases']  or 0,
                    'recent_activity': recent_activity,
                    'trends': {
                        'new_cases_trend':      new_cases_trend,
                        'new_cases_last_month': last_month_stats['new_cases'] or 0,
                        'closed_last_month':    last_month_stats['closed_last_month'] or 0,
                    }
                },
                'immediate_attention': _build_immediate_attention(high_risk_students_data),
                'classroom_stats': _build_classroom_stats(user),
            })

        except Exception as e:
            import traceback
            print(f"Dashboard error: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': 'Failed to load dashboard',
                'detail': str(e)
            }, status=500)


def _build_immediate_attention(high_risk_students_data):
    """Top 5 students with no intervention or overdue follow-up."""
    if not high_risk_students_data:
        return []
    student_ids = [s['student__student_id'] for s in high_risk_students_data]
    has_case_ids = set(
        InterventionCase.objects.filter(
            student__student_id__in=student_ids
        ).values_list('student__student_id', flat=True)
    )
    return [
        s for s in high_risk_students_data
        if s['student__student_id'] not in has_case_ids
    ][:5]


def _build_classroom_stats(user):
    """Classroom health stats for the form master's assigned classrooms."""
    my_classrooms = Classroom.objects.filter(form_master=user)
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    stats = []

    for classroom in my_classrooms:
        total_students = StudentEnrollment.objects.filter(
            classroom=classroom, is_active=True
        ).count()

        student_day_map = defaultdict(lambda: defaultdict(list))
        for rec in AttendanceRecord.objects.filter(
            session__classroom=classroom,
            session__attendance_date__gte=thirty_days_ago
        ).select_related('session'):
            student_day_map[rec.student_id][rec.session.attendance_date].append(rec)

        present_days = absent_days = late_days = 0
        for _sid, days in student_day_map.items():
            for _d, recs in days.items():
                result = classify_day(recs)
                present_days += result['present']
                absent_days  += result['absent']
                late_days    += result['late']

        total_student_days = present_days + absent_days
        attendance_rate = round((present_days / total_student_days) * 100, 1) if total_student_days > 0 else 0

        avg_risk = StudentRiskProfile.objects.filter(
            student__enrollments__classroom=classroom,
            student__enrollments__is_active=True
        ).aggregate(avg=Avg('risk_score'))['avg'] or 0

        health_status = 'critical' if avg_risk >= 60 else 'moderate' if avg_risk >= 30 else 'healthy'

        stats.append({
            'classroom_id':   classroom.class_id,
            'classroom_name': classroom.name,
            'total_students': total_students,
            'attendance_rate': attendance_rate,
            'absent_count':   round(absent_days),
            'late_count':     late_days,
            'present_count':  round(present_days),
            'avg_risk_score': round(float(avg_risk), 1),
            'health_status':  health_status,
        })

    return stats
