# Example: How to update your existing views with permissions

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.permissions import require_role, validate_resource_ownership
from interventions.models import InterventionCase
from alerts.models import Alert

# BEFORE (Insecure):
# @api_view(['PATCH'])
# def update_alert(request, alert_id):
#     alert = Alert.objects.get(pk=alert_id)
#     alert.status = request.data['status']
#     alert.save()
#     return Response({'success': True})

# AFTER (Secure):
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@require_role('form_master', 'admin')
@validate_resource_ownership(Alert, id_param='alert_id', owner_field='assigned_to')
def update_alert(request, alert_id):
    """Update alert with permission checks and version control"""
    try:
        alert = Alert.objects.get(pk=alert_id)
        
        # Version control check
        client_version = request.data.get('version')
        if client_version and alert.version != client_version:
            return Response({
                'error': 'Alert was modified by another user. Please refresh.',
                'current_version': alert.version
            }, status=409)
        
        # Update alert
        alert.status = request.data['status']
        alert.save()  # Version auto-increments
        
        return Response({
            'success': True,
            'version': alert.version
        })
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@require_role('form_master', 'admin')
def update_case(request, case_id):
    """Update intervention case with version control"""
    try:
        case = InterventionCase.objects.get(pk=case_id)
        
        # Version control
        client_version = request.data.get('version')
        if client_version and case.version != client_version:
            return Response({
                'error': 'Case was modified by another user. Please refresh.',
                'current_version': case.version
            }, status=409)
        
        # Update case
        case.progress_status = request.data.get('progress_status', case.progress_status)
        case.meeting_notes = request.data.get('meeting_notes', case.meeting_notes)
        case.meeting_date = request.data.get('meeting_date', case.meeting_date)
        case.save()
        
        return Response({
            'success': True,
            'version': case.version
        })
    except InterventionCase.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
