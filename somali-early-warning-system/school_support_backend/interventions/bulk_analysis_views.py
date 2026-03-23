"""
Bulk Analysis API Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .bulk_analysis_service import BulkAnalysisService


class BulkAnalysisView(APIView):
    """Analyze all students or filter by classroom"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        academic_year = request.query_params.get('academic_year')
        
        # Form masters can only see their classroom
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if not managed_classroom:
                return Response(
                    {'error': 'No classroom assigned to this form master'},
                    status=status.HTTP_403_FORBIDDEN
                )
            classroom_id = managed_classroom.class_id
        
        # Admins can see all or filter
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            result = BulkAnalysisService.analyze_all_students(
                classroom_id=classroom_id,
                academic_year=academic_year
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PriorityListView(APIView):
    """Generate prioritized intervention list"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        limit = int(request.query_params.get('limit', 50))
        
        # Form masters can only see their classroom
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if not managed_classroom:
                return Response(
                    {'error': 'No classroom assigned to this form master'},
                    status=status.HTTP_403_FORBIDDEN
                )
            classroom_id = managed_classroom.class_id
        
        # Admins can see all or filter
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            analysis = BulkAnalysisService.analyze_all_students(classroom_id=classroom_id)
            priority_list = BulkAnalysisService.generate_priority_list(analysis, limit=limit)
            
            return Response({
                'priority_list': priority_list,
                'total_priority': len(priority_list),
                'generated_at': analysis['analyzed_at']
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WeeklyReportView(APIView):
    """Generate weekly summary report"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        
        # Form masters can only see their classroom
        if request.user.role == 'form_master':
            managed_classroom = request.user.managed_classrooms.first()
            if not managed_classroom:
                return Response(
                    {'error': 'No classroom assigned to this form master'},
                    status=status.HTTP_403_FORBIDDEN
                )
            classroom_id = managed_classroom.class_id
        
        # Admins can see all or filter
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            report = BulkAnalysisService.generate_weekly_report(classroom_id=classroom_id)
            return Response(report, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
