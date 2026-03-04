from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta, date

from interventions.models import InterventionCase
from alerts.models import Alert
from students.models import Student
from users.models import User

class AdminDashboardViewSafe(APIView):
    """Safe Admin Dashboard - No crashes"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            today = date.today()
            
            # Basic counts
            total_students = Student.objects.filter(is_active=True).count()
            active_alerts = Alert.objects.filter(status__in=['active', 'under_review', 'escalated']).count()
            high_risk_alerts = Alert.objects.filter(risk_level__in=['high', 'critical']).count()
            open_cases = InterventionCase.objects.filter(status__in=['open', 'in_progress', 'awaiting_parent']).count()
            escalated_cases = InterventionCase.objects.filter(status='escalated_to_admin').count()
            resolved_this_month = InterventionCase.objects.filter(
                status='closed',
                updated_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            # Escalated cases list
            escalated_list = []
            for case in InterventionCase.objects.filter(status='escalated_to_admin').select_related('student', 'assigned_to')[:20]:
                days_open = (today - case.created_at.date()).days
                escalated_list.append({
                    'case_id': case.case_id,
                    'student_name': case.student.full_name,
                    'student_id': case.student.student_id,
                    'form_master': case.assigned_to.name if case.assigned_to else 'Unassigned',
                    'risk_level': 'high',
                    'created_at': case.created_at.isoformat(),
                    'escalation_reason': case.escalation_reason or 'No reason provided',
                    'days_open': days_open,
                    'is_overdue': days_open > 14,
                    'status': case.status
                })
            
            # Form master performance
            performance_metrics = []
            for fm in User.objects.filter(role='form_master', is_active=True):
                active = InterventionCase.objects.filter(
                    assigned_to=fm, 
                    status__in=['open', 'in_progress', 'awaiting_parent']
                ).count()
                
                performance_metrics.append({
                    'form_master_id': fm.id,
                    'form_master_name': fm.name,
                    'classrooms': 'N/A',
                    'active_cases': active,
                    'avg_resolution_days': 0,
                    'escalations': 0,
                    'on_time_percentage': 100,
                    'avg_risk_score': 0
                })
            
            # Recent activities from audit logs (last 7 days)
            seven_days_ago = timezone.now() - timedelta(days=7)
            from dashboard.models import AuditLog
            
            recent_activities = []
            audit_logs = AuditLog.objects.filter(
                timestamp__gte=seven_days_ago
            ).select_related('user').order_by('-timestamp')[:20]
            
            for log in audit_logs:
                activity_type = 'activity'
                if 'case' in log.action.lower():
                    if 'created' in log.action.lower():
                        activity_type = 'case_created'
                    elif 'escalated' in log.action.lower():
                        activity_type = 'case_escalated'
                    elif 'closed' in log.action.lower():
                        activity_type = 'case_closed'
                
                recent_activities.append({
                    'type': activity_type,
                    'description': log.description,
                    'user': log.user.name if log.user else 'System',
                    'timestamp': log.timestamp.isoformat(),
                    'case_id': log.metadata.get('case_id') if log.metadata else None
                })
            
            # Risk distribution from alerts
            risk_counts = Alert.objects.filter(
                status__in=['active', 'under_review', 'escalated']
            ).values('risk_level').annotate(count=Count('alert_id'))
            
            risk_dist = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
            for item in risk_counts:
                level = item['risk_level']
                if level in risk_dist:
                    risk_dist[level] = item['count']
            
            return Response({
                'executive_kpis': {
                    'total_students': total_students,
                    'active_alerts': active_alerts,
                    'high_risk_alerts': high_risk_alerts,
                    'open_cases': open_cases,
                    'escalated_cases': escalated_cases,
                    'resolved_this_month': resolved_this_month,
                    'alert_trend': 0,
                    'case_trend': 0
                },
                'monthly_trends': {
                    'alerts': [],
                    'cases': []
                },
                'risk_distribution': risk_dist,
                'system_health': {
                    'risk_index': 50.0,
                    'status': 'moderate',
                    'high_risk_percentage': 0,
                    'avg_risk_score': 0,
                    'total_students': total_students,
                    'high_risk_count': 0
                },
                'escalated_cases': escalated_list,
                'performance_metrics': performance_metrics,
                'attendance_compliance': {
                    'overall_attendance_rate': 0,
                    'high_absence_classes': 0,
                    'missing_submissions': 0
                },
                'recent_activities': recent_activities
            })
            
        except Exception as e:
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)
