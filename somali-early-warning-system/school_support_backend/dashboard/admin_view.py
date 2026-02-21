from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F, Sum, Case, When, IntegerField
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from interventions.models import InterventionCase
from alerts.models import Alert
from students.models import Student, StudentEnrollment, Classroom
from users.models import User
from attendance.models import AttendanceRecord, AttendanceSession


class AdminDashboardView(APIView):
    """Enterprise Admin Dashboard - System Control Center"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            today = date.today()
            now = timezone.now()
            last_month_start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0)
            prev_month_start = (now - timedelta(days=60)).replace(hour=0, minute=0, second=0)
            six_months_ago = (now - timedelta(days=180)).replace(day=1)
            
            # 1. EXECUTIVE KPIs
            total_students = Student.objects.filter(is_active=True).count()
            active_alerts = Alert.objects.filter(status__in=['active', 'under_review', 'escalated']).count()
            high_risk_alerts = Alert.objects.filter(risk_level__in=['high', 'critical'], status__in=['active', 'under_review']).count()
            open_cases = InterventionCase.objects.filter(status__in=['open', 'in_progress', 'awaiting_parent']).count()
            escalated_cases = InterventionCase.objects.filter(status='escalated_to_admin').count()
            
            # Resolved this month
            resolved_this_month = InterventionCase.objects.filter(
                status='closed',
                updated_at__gte=last_month_start
            ).count()
            
            # Trends (vs last month)
            last_month_alerts = Alert.objects.filter(alert_date__gte=last_month_start).count()
            prev_month_alerts = Alert.objects.filter(alert_date__gte=prev_month_start, alert_date__lt=last_month_start).count()
            alert_trend = ((last_month_alerts - prev_month_alerts) / prev_month_alerts * 100) if prev_month_alerts > 0 else (100 if last_month_alerts > 0 else 0)
            
            last_month_cases = InterventionCase.objects.filter(created_at__gte=last_month_start).count()
            prev_month_cases = InterventionCase.objects.filter(created_at__gte=prev_month_start, created_at__lt=last_month_start).count()
            case_trend = ((last_month_cases - prev_month_cases) / prev_month_cases * 100) if prev_month_cases > 0 else (100 if last_month_cases > 0 else 0)
            
            # 2. MONTHLY TRENDS (6 months)
            alert_trend_data = Alert.objects.filter(
                alert_date__gte=six_months_ago
            ).annotate(month=TruncMonth('alert_date')).values('month').annotate(
                active=Count('alert_id', filter=Q(status__in=['active', 'under_review'])),
                escalated=Count('alert_id', filter=Q(status='escalated'))
            ).order_by('month')
            
            case_trend_data = InterventionCase.objects.filter(
                created_at__gte=six_months_ago
            ).annotate(month=TruncMonth('created_at')).values('month').annotate(
                created=Count('case_id'),
                closed=Count('case_id', filter=Q(status='closed')),
                escalated=Count('case_id', filter=Q(status='escalated_to_admin'))
            ).order_by('month')
            
            # 3. RISK DISTRIBUTION
            risk_distribution = Student.objects.filter(
                is_active=True,
                risk_profile__isnull=False
            ).values('risk_profile__risk_level').annotate(count=Count('student_id'))
            
            risk_dist_dict = {item['risk_profile__risk_level']: item['count'] for item in risk_distribution}
            
            # 4. SYSTEM HEALTH SCORE
            high_risk_count = Student.objects.filter(
                is_active=True,
                risk_profile__risk_level__in=['high', 'critical']
            ).count()
            high_risk_percentage = (high_risk_count / total_students * 100) if total_students > 0 else 0
            
            avg_risk_score = Student.objects.filter(
                is_active=True,
                risk_profile__isnull=False
            ).aggregate(avg_score=Avg('risk_profile__risk_score'))['avg_score'] or 0
            
            # School Risk Index (0-100, lower is better)
            risk_index = min(100, (
                (high_risk_percentage * 1.5) +
                (escalated_cases * 2) +
                (open_cases * 0.5) +
                (100 - (resolved_this_month * 2))
            ) / 4)
            
            health_status = 'healthy' if risk_index < 30 else 'moderate' if risk_index < 60 else 'critical'
            
            # 5. ESCALATED CASES (for control panel)
            escalated_cases_data = InterventionCase.objects.filter(
                status='escalated_to_admin'
            ).select_related('student', 'assigned_to', 'student__risk_profile').order_by('-created_at')[:50]
            
            escalated_list = []
            for case in escalated_cases_data:
                days_open = (today - case.created_at.date()).days
                escalated_list.append({
                    'case_id': case.case_id,
                    'student_name': case.student.full_name,
                    'student_id': case.student.student_id,
                    'form_master': case.assigned_to.name if case.assigned_to else 'Unassigned',
                    'risk_level': case.student.risk_profile.risk_level if hasattr(case.student, 'risk_profile') else 'unknown',
                    'created_at': case.created_at.isoformat(),
                    'follow_up_date': case.follow_up_date.isoformat() if case.follow_up_date else None,
                    'escalation_reason': case.escalation_reason or 'No reason provided',
                    'days_open': days_open,
                    'is_overdue': days_open > 14,
                    'status': case.status
                })
            
            # 6. FORM MASTER PERFORMANCE
            form_masters = User.objects.filter(role='form_master', is_active=True)
            performance_metrics = []
            
            for fm in form_masters:
                active_cases = InterventionCase.objects.filter(
                    assigned_to=fm, 
                    status__in=['open', 'in_progress', 'awaiting_parent']
                ).count()
                
                closed_cases = InterventionCase.objects.filter(assigned_to=fm, status='closed')
                
                # Average resolution time
                resolution_times = []
                for case in closed_cases:
                    if case.created_at and case.updated_at:
                        days = (case.updated_at.date() - case.created_at.date()).days
                        resolution_times.append(days)
                
                avg_resolution = sum(resolution_times) / len(resolution_times) if resolution_times else 0
                
                # Escalations
                escalations = InterventionCase.objects.filter(assigned_to=fm, status='escalated_to_admin').count()
                
                # Cases resolved within 14 days
                resolved_on_time = sum(1 for t in resolution_times if t <= 14)
                on_time_percentage = (resolved_on_time / len(resolution_times) * 100) if resolution_times else 100
                
                # Get classrooms
                classrooms = Classroom.objects.filter(form_master=fm)
                classroom_names = ', '.join([c.name for c in classrooms[:3]])
                
                # Risk trend (avg risk in their classrooms)
                avg_classroom_risk = Student.objects.filter(
                    enrollments__classroom__in=classrooms,
                    enrollments__is_active=True,
                    risk_profile__isnull=False
                ).aggregate(avg=Avg('risk_profile__risk_score'))['avg'] or 0
                
                performance_metrics.append({
                    'form_master_id': fm.id,
                    'form_master_name': fm.name,
                    'classrooms': classroom_names,
                    'active_cases': active_cases,
                    'avg_resolution_days': round(avg_resolution, 1),
                    'escalations': escalations,
                    'on_time_percentage': round(on_time_percentage, 1),
                    'avg_risk_score': round(float(avg_classroom_risk), 1)
                })
            
            # Sort by active cases (descending)
            performance_metrics.sort(key=lambda x: x['active_cases'], reverse=True)
            
            # 7. ATTENDANCE COMPLIANCE
            thirty_days_ago = today - timedelta(days=30)
            
            # Overall attendance rate (last 30 days)
            recent_records = AttendanceRecord.objects.filter(
                session__attendance_date__gte=thirty_days_ago
            )
            total_records = recent_records.count()
            present_records = recent_records.filter(status='present').count()
            overall_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0
            
            # Classes with high absence (>30%)
            classrooms = Classroom.objects.all()
            high_absence_classes = 0
            
            for classroom in classrooms:
                classroom_records = AttendanceRecord.objects.filter(
                    session__classroom=classroom,
                    session__attendance_date__gte=thirty_days_ago
                )
                total = classroom_records.count()
                absent = classroom_records.filter(status='absent').count()
                if total > 0 and (absent / total) > 0.3:
                    high_absence_classes += 1
            
            # Sessions without attendance (last 7 days)
            seven_days_ago = today - timedelta(days=7)
            total_sessions = AttendanceSession.objects.filter(
                attendance_date__gte=seven_days_ago
            ).count()
            sessions_with_records = AttendanceSession.objects.filter(
                attendance_date__gte=seven_days_ago,
                attendance_records__isnull=False
            ).distinct().count()
            missing_submissions = total_sessions - sessions_with_records
            
            attendance_compliance = {
                'overall_attendance_rate': round(overall_attendance_rate, 1),
                'high_absence_classes': high_absence_classes,
                'missing_submissions': missing_submissions
            }
            
            # 8. RECENT ACTIVITIES
            recent_activities = []
            
            # Recent case creations (last 7 days)
            recent_cases = InterventionCase.objects.filter(
                created_at__gte=now - timedelta(days=7)
            ).select_related('student', 'assigned_to').order_by('-created_at')[:10]
            
            for case in recent_cases:
                recent_activities.append({
                    'type': 'case_created',
                    'description': f"Case #{case.case_id} created for {case.student.full_name}",
                    'user': case.assigned_to.name if case.assigned_to else 'System',
                    'timestamp': case.created_at.isoformat(),
                    'case_id': case.case_id
                })
            
            # Recent escalations
            recent_escalations = InterventionCase.objects.filter(
                status='escalated_to_admin',
                updated_at__gte=now - timedelta(days=7)
            ).select_related('student', 'assigned_to').order_by('-updated_at')[:10]
            
            for case in recent_escalations:
                recent_activities.append({
                    'type': 'case_escalated',
                    'description': f"Case #{case.case_id} escalated - {case.student.full_name}",
                    'user': case.assigned_to.name if case.assigned_to else 'Form Master',
                    'timestamp': case.updated_at.isoformat(),
                    'case_id': case.case_id
                })
            
            # Recent closed cases
            recent_closed = InterventionCase.objects.filter(
                status='closed',
                updated_at__gte=now - timedelta(days=7)
            ).select_related('student', 'assigned_to').order_by('-updated_at')[:10]
            
            for case in recent_closed:
                recent_activities.append({
                    'type': 'case_closed',
                    'description': f"Case #{case.case_id} resolved - {case.student.full_name}",
                    'user': case.assigned_to.name if case.assigned_to else 'System',
                    'timestamp': case.updated_at.isoformat(),
                    'case_id': case.case_id
                })
            
            # Sort by timestamp
            recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
            recent_activities = recent_activities[:15]
            
            return Response({
                'executive_kpis': {
                    'total_students': total_students,
                    'active_alerts': active_alerts,
                    'high_risk_alerts': high_risk_alerts,
                    'open_cases': open_cases,
                    'escalated_cases': escalated_cases,
                    'resolved_this_month': resolved_this_month,
                    'alert_trend': round(alert_trend, 1),
                    'case_trend': round(case_trend, 1)
                },
                'monthly_trends': {
                    'alerts': [
                        {
                            'month': item['month'].strftime('%Y-%m'),
                            'active': item['active'],
                            'escalated': item['escalated']
                        } for item in alert_trend_data
                    ],
                    'cases': [
                        {
                            'month': item['month'].strftime('%Y-%m'),
                            'created': item['created'],
                            'closed': item['closed'],
                            'escalated': item['escalated']
                        } for item in case_trend_data
                    ]
                },
                'risk_distribution': {
                    'low': risk_dist_dict.get('low', 0),
                    'medium': risk_dist_dict.get('medium', 0),
                    'high': risk_dist_dict.get('high', 0),
                    'critical': risk_dist_dict.get('critical', 0)
                },
                'system_health': {
                    'risk_index': round(risk_index, 1),
                    'status': health_status,
                    'high_risk_percentage': round(high_risk_percentage, 1),
                    'avg_risk_score': round(float(avg_risk_score), 1),
                    'total_students': total_students,
                    'high_risk_count': high_risk_count
                },
                'escalated_cases': escalated_list,
                'performance_metrics': performance_metrics,
                'attendance_compliance': attendance_compliance,
                'recent_activities': recent_activities
            })
            
        except Exception as e:
            import traceback
            print(f"Admin dashboard error: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': 'Failed to load admin dashboard',
                'detail': str(e)
            }, status=500)
