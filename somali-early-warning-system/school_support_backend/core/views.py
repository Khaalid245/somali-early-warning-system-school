from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import AuditLog
from .permissions import require_role

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR', '')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_audit(request):
    """Create audit log entry"""
    try:
        AuditLog.objects.create(
            user=request.user,
            action=request.data.get('action'),
            details=request.data.get('details', {}),
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session_id=request.data.get('sessionId', '')
        )
        return Response({'success': True}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_role('admin', 'form_master')
def get_audit_logs(request):
    """Retrieve audit logs with filters"""
    logs = AuditLog.objects.all()
    
    # Filter by user
    user_id = request.GET.get('user_id')
    if user_id:
        logs = logs.filter(user_id=user_id)
    
    # Filter by action
    action = request.GET.get('action')
    if action:
        logs = logs.filter(action=action)
    
    # Filter by date range
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    if start_date:
        logs = logs.filter(timestamp__gte=start_date)
    if end_date:
        logs = logs.filter(timestamp__lte=end_date)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))
    start = (page - 1) * page_size
    end = start + page_size
    
    logs_data = [{
        'id': log.id,
        'user': log.user.email if log.user else 'Unknown',
        'action': log.action,
        'details': log.details,
        'timestamp': log.timestamp.isoformat(),
        'ip_address': log.ip_address
    } for log in logs[start:end]]
    
    return Response({
        'count': logs.count(),
        'results': logs_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_role('admin')
def export_audit_logs(request):
    """Export audit logs as CSV"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'User', 'Action', 'Details', 'IP Address'])
    
    logs = AuditLog.objects.all()[:1000]  # Limit to 1000 records
    for log in logs:
        writer.writerow([
            log.timestamp,
            log.user.email if log.user else 'Unknown',
            log.action,
            str(log.details),
            log.ip_address
        ])
    
    return response
