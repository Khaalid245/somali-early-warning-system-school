"""
Progress Tracking API Views
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from interventions.progress_tracking_service import (
    get_student_progress_timeline,
    get_intervention_effectiveness,
    identify_patterns,
    get_progress_dashboard_data
)


class StudentProgressView(APIView):
    """Get individual student progress timeline"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        student_id = request.query_params.get('student_id')
        weeks = int(request.query_params.get('weeks', 4))
        
        if not student_id:
            return Response(
                {'error': 'student_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            progress_data = get_student_progress_timeline(student_id, weeks)
            
            if 'error' in progress_data:
                return Response(progress_data, status=status.HTTP_404_NOT_FOUND)
            
            return Response(progress_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to get progress data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InterventionEffectivenessView(APIView):
    """Get intervention effectiveness statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Form masters see only their classroom
        classroom_id = None
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if managed_classroom:
                classroom_id = managed_classroom.class_id
        
        # Admins can filter by classroom or see all
        if request.user.role == 'admin':
            classroom_id = request.query_params.get('classroom_id', None)
        
        try:
            effectiveness_data = get_intervention_effectiveness(classroom_id)
            return Response(effectiveness_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to get effectiveness data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PatternsView(APIView):
    """Get identified patterns in absences and interventions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Form masters see only their classroom
        classroom_id = None
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if managed_classroom:
                classroom_id = managed_classroom.class_id
        
        # Admins can filter by classroom or see all
        if request.user.role == 'admin':
            classroom_id = request.query_params.get('classroom_id', None)
        
        try:
            patterns_data = identify_patterns(classroom_id)
            return Response(patterns_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to get patterns: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProgressDashboardView(APIView):
    """Get complete progress dashboard data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Form masters see only their classroom
        classroom_id = None
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if managed_classroom:
                classroom_id = managed_classroom.class_id
        
        # Admins can filter by classroom or see all
        if request.user.role == 'admin':
            classroom_id = request.query_params.get('classroom_id', None)
        
        try:
            dashboard_data = get_progress_dashboard_data(classroom_id, request_user=request.user)
            return Response(dashboard_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to get dashboard data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
