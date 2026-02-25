from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Prefetch
from django.utils import timezone
from datetime import timedelta

from interventions.models import InterventionCase
from alerts.models import Alert
from students.models import Student
from interventions.serializers import InterventionCaseSerializer
from alerts.serializers import AlertSerializer
from students.serializers import StudentSerializer


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
            # Optimized queries with select_related/prefetch_related
            pending_cases = InterventionCase.objects.select_related(
                'student__risk_profile',
                'assigned_to',
                'alert'
            ).prefetch_related(
                'student__enrollments__classroom'
            ).filter(
                assigned_to=user,
                status__in=['open', 'in_progress', 'escalated_to_admin']
            ).order_by('-created_at')[:20]
            
            urgent_alerts = Alert.objects.select_related(
                'student', 'assigned_to', 'subject'
            ).filter(
                assigned_to=user,
                status__in=['active', 'pending', 'under_review']
            ).order_by('-alert_date')[:10]
            
            from attendance.models import AttendanceRecord
            from django.db.models import Count, Case, When, IntegerField
            from datetime import date
            
            # Get students with attendance stats and classroom info
            high_risk_students = Student.objects.filter(
                is_active=True,
                risk_profile__isnull=False
            ).select_related(
                'risk_profile'
            ).prefetch_related(
                'enrollments__classroom'
            ).annotate(
                total_sessions=Count('attendance_records'),
                present_count=Count('attendance_records', filter=Q(attendance_records__status='present')),
                absent_count=Count('attendance_records', filter=Q(attendance_records__status='absent')),
                late_count=Count('attendance_records', filter=Q(attendance_records__status='late'))
            ).order_by('-risk_profile__risk_score')[:20]
            
            # Mark overdue cases
            today = date.today()
            pending_cases_list = list(pending_cases)
            for case in pending_cases_list:
                case.is_overdue = (
                    case.follow_up_date and 
                    case.follow_up_date < today and 
                    case.status != 'closed'
                )
            
            # Aggregate statistics with trends
            from datetime import timedelta
            last_month = timezone.now() - timedelta(days=30)
            
            stats = InterventionCase.objects.filter(assigned_to=user).aggregate(
                total_cases=Count('case_id'),
                open_cases=Count('case_id', filter=Q(status='open')),
                in_progress=Count('case_id', filter=Q(status='in_progress')),
                closed_cases=Count('case_id', filter=Q(status='closed'))
            )
            
            # Calculate trends (compare last 30 days vs previous 30 days)
            last_month_stats = InterventionCase.objects.filter(
                assigned_to=user,
                created_at__gte=last_month
            ).aggregate(
                new_cases=Count('case_id'),
                closed_last_month=Count('case_id', filter=Q(status='closed', updated_at__gte=last_month))
            )
            
            prev_month = timezone.now() - timedelta(days=60)
            prev_month_stats = InterventionCase.objects.filter(
                assigned_to=user,
                created_at__gte=prev_month,
                created_at__lt=last_month
            ).aggregate(
                prev_new_cases=Count('case_id')
            )
            
            # Calculate trend percentages
            new_cases_trend = 0
            if prev_month_stats['prev_new_cases'] > 0:
                new_cases_trend = int(((last_month_stats['new_cases'] - prev_month_stats['prev_new_cases']) / prev_month_stats['prev_new_cases']) * 100)
            
            # Recent activity (last 7 days)
            week_ago = timezone.now() - timedelta(days=7)
            recent_activity = InterventionCase.objects.filter(
                assigned_to=user,
                updated_at__gte=week_ago
            ).count()
            
            # Build high_risk_students response with safe attribute access
            high_risk_students_data = []
            for s in high_risk_students:
                # Get classroom safely
                classroom_name = 'Not Enrolled'
                active_enrollment = s.enrollments.filter(is_active=True).first()
                if active_enrollment and active_enrollment.classroom:
                    classroom_name = active_enrollment.classroom.name
                
                # Get risk level safely
                risk_level = 'low'
                if s.risk_profile:
                    risk_level = s.risk_profile.risk_level
                
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
            
            return Response({
                'pending_cases': [{
                    **InterventionCaseSerializer(case).data,
                    'is_overdue': getattr(case, 'is_overdue', False)
                } for case in pending_cases_list],
                'urgent_alerts': AlertSerializer(urgent_alerts, many=True).data,
                'high_risk_students': high_risk_students_data,
                'statistics': {
                    'total_cases': stats['total_cases'] or 0,
                    'open_cases': stats['open_cases'] or 0,
                    'in_progress': stats['in_progress'] or 0,
                    'closed_cases': stats['closed_cases'] or 0,
                    'recent_activity': recent_activity,
                    'trends': {
                        'new_cases_trend': new_cases_trend,
                        'new_cases_last_month': last_month_stats['new_cases'] or 0,
                        'closed_last_month': last_month_stats['closed_last_month'] or 0
                    }
                },
                'immediate_attention': [],
                'classroom_stats': []
            })
        except Exception as e:
            import traceback
            print(f"Dashboard error: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': 'Failed to load dashboard',
                'detail': str(e)
            }, status=500)
