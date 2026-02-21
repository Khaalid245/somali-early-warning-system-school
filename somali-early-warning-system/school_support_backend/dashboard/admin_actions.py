from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse

from interventions.models import InterventionCase
from alerts.models import Alert
from attendance.models import AttendanceRecord
from students.models import Student, Classroom, StudentEnrollment
from users.models import User


# =====================================================
# CASE REASSIGNMENT
# =====================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reassign_case(request, case_id):
    """Admin can reassign case to different form master"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admin can reassign cases'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        case = InterventionCase.objects.get(case_id=case_id)
    except InterventionCase.DoesNotExist:
        return Response(
            {'error': 'Case not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_form_master_id = request.data.get('new_form_master_id')
    reassignment_reason = request.data.get('reason', '')
    
    if not new_form_master_id:
        return Response(
            {'error': 'new_form_master_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        new_form_master = User.objects.get(id=new_form_master_id, role='form_master')
    except User.DoesNotExist:
        return Response(
            {'error': 'Form master not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    old_form_master = case.assigned_to
    case.assigned_to = new_form_master
    case.save()
    
    # Log the reassignment
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='case_reassigned',
        description=f'Case #{case_id} reassigned from {old_form_master.name if old_form_master else "Unassigned"} to {new_form_master.name}. Reason: {reassignment_reason}',
        metadata={
            'case_id': case_id,
            'old_form_master': old_form_master.id if old_form_master else None,
            'new_form_master': new_form_master.id,
            'reason': reassignment_reason
        }
    )
    
    return Response({
        'message': 'Case reassigned successfully',
        'case_id': case_id,
        'new_form_master': new_form_master.name
    })


# =====================================================
# ALERT STATUS UPDATE (ADMIN)
# =====================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_alert_status(request, alert_id):
    """Admin can update alert status"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admin can update alert status'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        alert = Alert.objects.get(alert_id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_status = request.data.get('status')
    valid_statuses = ['active', 'under_review', 'escalated', 'resolved', 'dismissed']
    
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    old_status = alert.status
    alert.status = new_status
    alert.save()
    
    # Log the action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='alert_status_updated',
        description=f'Alert #{alert_id} status changed from {old_status} to {new_status}',
        metadata={
            'alert_id': alert_id,
            'old_status': old_status,
            'new_status': new_status
        }
    )
    
    return Response({
        'message': 'Alert status updated successfully',
        'alert_id': alert_id,
        'new_status': new_status
    })


# =====================================================
# ALERT REASSIGNMENT
# =====================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reassign_alert(request, alert_id):
    """Admin can reassign alert to different form master"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admin can reassign alerts'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        alert = Alert.objects.get(alert_id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_form_master_id = request.data.get('new_form_master_id')
    
    if not new_form_master_id:
        return Response(
            {'error': 'new_form_master_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        new_form_master = User.objects.get(id=new_form_master_id, role='form_master')
    except User.DoesNotExist:
        return Response(
            {'error': 'Form master not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    old_form_master = alert.assigned_to
    alert.assigned_to = new_form_master
    alert.save()
    
    # Log the reassignment
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='alert_reassigned',
        description=f'Alert #{alert_id} reassigned from {old_form_master.name if old_form_master else "Unassigned"} to {new_form_master.name}',
        metadata={
            'alert_id': alert_id,
            'old_form_master': old_form_master.id if old_form_master else None,
            'new_form_master': new_form_master.id
        }
    )
    
    return Response({
        'message': 'Alert reassigned successfully',
        'alert_id': alert_id,
        'new_form_master': new_form_master.name
    })


# =====================================================
# ARCHIVE ALERT
# =====================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def archive_alert(request, alert_id):
    """Admin can archive alert"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admin can archive alerts'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        alert = Alert.objects.get(alert_id=alert_id)
    except Alert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    alert.status = 'dismissed'
    alert.save()
    
    # Log the action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='alert_archived',
        description=f'Alert #{alert_id} archived',
        metadata={'alert_id': alert_id}
    )
    
    return Response({
        'message': 'Alert archived successfully',
        'alert_id': alert_id
    })


# =====================================================
# ATTENDANCE DRILL-DOWN
# =====================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_drill_down(request):
    """Get detailed attendance compliance data"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        classrooms = Classroom.objects.filter(is_active=True)
        
        classroom_data = []
        for classroom in classrooms:
            students = Student.objects.filter(
                enrollments__classroom=classroom,
                enrollments__is_active=True
            )
            
            total_students = students.count()
            if total_students == 0:
                continue
            
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            
            attendance_records = AttendanceRecord.objects.filter(
                student__in=students,
                date__gte=thirty_days_ago
            )
            
            total_records = attendance_records.count()
            absent_records = attendance_records.filter(status='absent').count()
            
            absence_rate = (absent_records / total_records * 100) if total_records > 0 else 0
            
            classroom_data.append({
                'classroom_id': classroom.class_id,
                'classroom_name': classroom.name,
                'form_master': classroom.form_master.name if classroom.form_master else 'Unassigned',
                'total_students': total_students,
                'absence_rate': round(absence_rate, 2),
                'total_absences': absent_records,
                'is_high_risk': absence_rate > 30
            })
        
        classroom_data.sort(key=lambda x: x['absence_rate'], reverse=True)
        
        return Response({
            'classrooms': classroom_data,
            'high_risk_count': sum(1 for c in classroom_data if c['is_high_risk'])
        })
    except Exception as e:
        return Response({
            'classrooms': [],
            'high_risk_count': 0,
            'error': str(e)
        })


# =====================================================
# AUDIT LOG VIEWER
# =====================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    """Get comprehensive audit logs"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from dashboard.models import AuditLog
    
    # Filters
    action_filter = request.GET.get('action')
    user_filter = request.GET.get('user_id')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    logs = AuditLog.objects.select_related('user').all()
    
    if action_filter:
        logs = logs.filter(action=action_filter)
    
    if user_filter:
        logs = logs.filter(user_id=user_filter)
    
    if date_from:
        logs = logs.filter(timestamp__gte=date_from)
    
    if date_to:
        logs = logs.filter(timestamp__lte=date_to)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = 50
    start = (page - 1) * page_size
    end = start + page_size
    
    total_count = logs.count()
    logs = logs[start:end]
    
    log_data = [{
        'id': log.id,
        'user': log.user.name if log.user else 'System',
        'user_role': log.user.role if log.user else 'system',
        'action': log.action,
        'description': log.description,
        'timestamp': log.timestamp.isoformat(),
        'metadata': log.metadata
    } for log in logs]
    
    return Response({
        'logs': log_data,
        'total_count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size
    })


# =====================================================
# EXPORT REPORTS
# =====================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_cases_report(request):
    """Export intervention cases to CSV"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="cases_report_{timezone.now().strftime("%Y-%m-%d")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Case ID', 'Student', 'Form Master', 'Status', 'Progress', 'Days Open', 'Created Date', 'Escalation Reason'])
    
    cases = InterventionCase.objects.select_related('student', 'assigned_to').all()
    
    for case in cases:
        days_open = (timezone.now().date() - case.created_at.date()).days
        writer.writerow([
            case.case_id,
            case.student.full_name,
            case.assigned_to.name if case.assigned_to else 'Unassigned',
            case.status,
            case.progress_status,
            days_open,
            case.created_at.strftime('%Y-%m-%d'),
            case.escalation_reason or ''
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_risk_summary(request):
    """Export risk summary by classroom to CSV"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="risk_summary_{timezone.now().strftime("%Y-%m-%d")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Classroom', 'Form Master', 'Total Students', 'High Risk Students', 'Active Alerts', 'Open Cases', 'Risk Percentage'])
    
    classrooms = Classroom.objects.filter(is_active=True).select_related('form_master')
    
    for classroom in classrooms:
        students = Student.objects.filter(
            enrollments__classroom=classroom,
            enrollments__is_active=True
        )
        
        total_students = students.count()
        high_risk_students = students.filter(
            risk_scores__risk_level__in=['high', 'critical']
        ).distinct().count()
        
        active_alerts = Alert.objects.filter(
            student__in=students,
            status='active'
        ).count()
        
        open_cases = InterventionCase.objects.filter(
            student__in=students,
            status__in=['open', 'in_progress', 'awaiting_parent']
        ).count()
        
        risk_percentage = (high_risk_students / total_students * 100) if total_students > 0 else 0
        
        writer.writerow([
            classroom.name,
            classroom.form_master.name if classroom.form_master else 'Unassigned',
            total_students,
            high_risk_students,
            active_alerts,
            open_cases,
            f'{risk_percentage:.1f}%'
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_performance_metrics(request):
    """Export form master performance metrics to CSV"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="performance_metrics_{timezone.now().strftime("%Y-%m-%d")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Form Master', 'Classroom', 'Active Cases', 'Avg Resolution Time (days)', 'On-Time %', 'Escalation Count', 'Avg Risk Score', 'Rating'])
    
    form_masters = User.objects.filter(role='form_master')
    
    for fm in form_masters:
        classroom = Classroom.objects.filter(form_master=fm, is_active=True).first()
        
        cases = InterventionCase.objects.filter(assigned_to=fm)
        active_cases = cases.exclude(status='closed').count()
        
        closed_cases = cases.filter(status='closed')
        avg_resolution = closed_cases.aggregate(
            avg_days=Avg(F('updated_at') - F('created_at'))
        )['avg_days']
        
        avg_resolution_days = avg_resolution.days if avg_resolution else 0
        
        on_time_cases = closed_cases.filter(
            updated_at__lte=F('created_at') + timedelta(days=14)
        ).count()
        
        on_time_pct = (on_time_cases / closed_cases.count() * 100) if closed_cases.count() > 0 else 0
        
        escalation_count = cases.filter(status='escalated_to_admin').count()
        
        # Get avg risk score for classroom
        if classroom:
            students = Student.objects.filter(
                enrollments__classroom=classroom,
                enrollments__is_active=True
            )
            avg_risk = students.aggregate(
                avg=Avg('risk_scores__risk_score')
            )['avg'] or 0
        else:
            avg_risk = 0
        
        # Calculate rating
        if on_time_pct >= 80 and escalation_count < 2:
            rating = 'Excellent'
        elif on_time_pct >= 60 and escalation_count < 4:
            rating = 'Good'
        elif on_time_pct >= 40 and escalation_count < 6:
            rating = 'Fair'
        else:
            rating = 'Needs Improvement'
        
        writer.writerow([
            fm.name,
            classroom.name if classroom else 'No Classroom',
            active_cases,
            round(avg_resolution_days, 1),
            f'{on_time_pct:.1f}%',
            escalation_count,
            f'{avg_risk:.2f}',
            rating
        ])
    
    return response
