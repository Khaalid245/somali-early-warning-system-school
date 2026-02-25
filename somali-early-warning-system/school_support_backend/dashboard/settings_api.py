from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth.hashers import make_password
import os

from users.models import User
from dashboard.models import SystemSettings


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update user profile"""
    user = request.user
    
    if request.method == 'GET':
        profile_photo_url = None
        if user.profile_image:
            profile_photo_url = request.build_absolute_uri(user.profile_image.url)
        print(f"GET Profile - User: {user.email}, Photo URL: {profile_photo_url}")
        return Response({
            'name': user.name,
            'email': user.email,
            'phone': user.phone or '',
            'bio': user.biography or '',
            'profile_photo': profile_photo_url
        })
    
    elif request.method == 'PUT':
        print(f"PUT Profile - User: {user.email}")
        print(f"Request FILES: {request.FILES}")
        print(f"Request DATA: {request.data}")
        
        # Update basic fields
        user.name = request.data.get('name', user.name)
        user.email = request.data.get('email', user.email)
        user.phone = request.data.get('phone', user.phone)
        user.biography = request.data.get('bio', user.biography)
        
        # Handle profile photo upload
        if 'profile_photo' in request.FILES:
            print(f"Uploading new photo: {request.FILES['profile_photo'].name}")
            if user.profile_image:
                user.profile_image.delete(save=False)
            user.profile_image = request.FILES['profile_photo']
        
        user.save()
        print(f"User saved. Profile image: {user.profile_image}")
        
        profile_photo_url = None
        if user.profile_image:
            profile_photo_url = request.build_absolute_uri(user.profile_image.url)
        print(f"Returning photo URL: {profile_photo_url}")
        
        return Response({
            'message': 'Profile updated successfully',
            'name': user.name,
            'email': user.email,
            'phone': user.phone or '',
            'bio': user.biography or '',
            'profile_photo': profile_photo_url
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response(
            {'error': 'Both current and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify current password
    from django.contrib.auth.hashers import check_password
    if not check_password(current_password, user.password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def school_settings(request):
    """Get or update school settings"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    settings, created = SystemSettings.objects.get_or_create(id=1)
    
    if request.method == 'GET':
        return Response({
            'school_name': settings.school_name,
            'school_code': settings.school_code,
            'school_address': settings.school_address,
            'school_phone': settings.school_phone,
            'school_email': settings.school_email,
            'academic_year': settings.academic_year,
            'school_logo': settings.school_logo.url if settings.school_logo else None
        })
    
    elif request.method == 'PUT':
        data = request.data
        
        if 'school_name' in data:
            settings.school_name = data['school_name']
        if 'school_code' in data:
            settings.school_code = data['school_code']
        if 'school_address' in data:
            settings.school_address = data['school_address']
        if 'school_phone' in data:
            settings.school_phone = data['school_phone']
        if 'school_email' in data:
            settings.school_email = data['school_email']
        if 'academic_year' in data:
            settings.academic_year = data['academic_year']
        
        # Handle logo upload
        if 'school_logo' in request.FILES:
            logo = request.FILES['school_logo']
            if settings.school_logo:
                if os.path.isfile(settings.school_logo.path):
                    os.remove(settings.school_logo.path)
            settings.school_logo = logo
        
        settings.save()
        
        return Response({
            'message': 'School settings updated successfully',
            'school_logo': settings.school_logo.url if settings.school_logo else None
        })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def system_configuration(request):
    """Get or update system configuration"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    settings, created = SystemSettings.objects.get_or_create(id=1)
    
    if request.method == 'GET':
        return Response({
            'absence_threshold': settings.absence_threshold,
            'auto_escalation_days': settings.auto_escalation_days,
            'email_notifications': settings.email_notifications,
            'sms_notifications': settings.sms_notifications,
            'risk_low_min': settings.risk_low_min,
            'risk_medium_min': settings.risk_medium_min,
            'risk_high_min': settings.risk_high_min,
            'risk_critical_min': settings.risk_critical_min
        })
    
    elif request.method == 'PUT':
        data = request.data
        
        if 'absence_threshold' in data:
            settings.absence_threshold = int(data['absence_threshold'])
        if 'auto_escalation_days' in data:
            settings.auto_escalation_days = int(data['auto_escalation_days'])
        if 'email_notifications' in data:
            settings.email_notifications = data['email_notifications']
        if 'sms_notifications' in data:
            settings.sms_notifications = data['sms_notifications']
        if 'risk_low_min' in data:
            settings.risk_low_min = int(data['risk_low_min'])
        if 'risk_medium_min' in data:
            settings.risk_medium_min = int(data['risk_medium_min'])
        if 'risk_high_min' in data:
            settings.risk_high_min = int(data['risk_high_min'])
        if 'risk_critical_min' in data:
            settings.risk_critical_min = int(data['risk_critical_min'])
        
        settings.save()
        
        return Response({'message': 'System configuration updated successfully'})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def security_settings(request):
    """Get or update security settings"""
    
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    settings, created = SystemSettings.objects.get_or_create(id=1)
    
    if request.method == 'GET':
        return Response({
            'session_timeout': settings.session_timeout,
            'password_min_length': settings.password_min_length,
            'require_uppercase': settings.require_uppercase,
            'require_numbers': settings.require_numbers,
            'data_retention_years': settings.data_retention_years,
            'two_factor_auth': settings.two_factor_auth
        })
    
    elif request.method == 'PUT':
        data = request.data
        
        if 'session_timeout' in data:
            settings.session_timeout = int(data['session_timeout'])
        if 'password_min_length' in data:
            settings.password_min_length = int(data['password_min_length'])
        if 'require_uppercase' in data:
            settings.require_uppercase = data['require_uppercase']
        if 'require_numbers' in data:
            settings.require_numbers = data['require_numbers']
        if 'data_retention_years' in data:
            settings.data_retention_years = int(data['data_retention_years'])
        if 'two_factor_auth' in data:
            settings.two_factor_auth = data['two_factor_auth']
        
        settings.save()
        
        return Response({'message': 'Security settings updated successfully'})
