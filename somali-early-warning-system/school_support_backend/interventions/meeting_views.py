from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Prefetch
from django.utils import timezone

from .models import InterventionMeeting, ProgressUpdate
from .serializers import InterventionMeetingSerializer, ProgressUpdateSerializer
from students.models import Student


# =====================================================
# LIST & CREATE INTERVENTION MEETINGS
# =====================================================
class InterventionMeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = InterventionMeetingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Only Form Masters and Admins can access
        if user.role not in ['form_master', 'admin']:
            return InterventionMeeting.objects.none()
        
        qs = InterventionMeeting.objects.select_related(
            'student', 'created_by'
        ).prefetch_related(
            Prefetch('progress_updates', queryset=ProgressUpdate.objects.select_related('created_by'))
        )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Filter by urgency
        urgency_filter = self.request.query_params.get('urgency')
        if urgency_filter:
            qs = qs.filter(urgency_level=urgency_filter)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        
        # Form masters see only their own meetings
        if user.role == 'form_master':
            qs = qs.filter(created_by=user)
        
        return qs
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role not in ['form_master', 'admin']:
            raise PermissionDenied("Only Form Masters can create intervention meetings.")
        
        serializer.save(created_by=user)


# =====================================================
# DETAIL / UPDATE / DELETE INTERVENTION MEETING
# =====================================================
class InterventionMeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterventionMeetingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        qs = InterventionMeeting.objects.select_related(
            'student', 'created_by'
        ).prefetch_related(
            Prefetch('progress_updates', queryset=ProgressUpdate.objects.select_related('created_by'))
        )
        
        # Form masters can only access their own meetings
        if user.role == 'form_master':
            return qs.filter(created_by=user)
        
        # Admins can access all
        if user.role == 'admin':
            return qs
        
        return InterventionMeeting.objects.none()
    
    def perform_update(self, serializer):
        user = self.request.user
        meeting = self.get_object()
        
        # Only creator or admin can update
        if user.role == 'form_master' and meeting.created_by != user:
            raise PermissionDenied("You can only update your own meetings.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only creator or admin can delete
        if user.role == 'form_master' and instance.created_by != user:
            raise PermissionDenied("You can only delete your own meetings.")
        
        instance.delete()


# =====================================================
# ADD PROGRESS UPDATE
# =====================================================
class ProgressUpdateCreateView(generics.CreateAPIView):
    serializer_class = ProgressUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role not in ['form_master', 'admin']:
            raise PermissionDenied("Only Form Masters can add progress updates.")
        
        meeting_id = self.request.data.get('meeting')
        
        try:
            meeting = InterventionMeeting.objects.get(id=meeting_id)
        except InterventionMeeting.DoesNotExist:
            raise PermissionDenied("Meeting not found.")
        
        # Form masters can only update their own meetings
        if user.role == 'form_master' and meeting.created_by != user:
            raise PermissionDenied("You can only add updates to your own meetings.")
        
        serializer.save(created_by=user)


# =====================================================
# STUDENT INTERVENTION HISTORY
# =====================================================
class StudentInterventionHistoryView(generics.ListAPIView):
    serializer_class = InterventionMeetingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        user = self.request.user
        
        if user.role not in ['form_master', 'admin']:
            return InterventionMeeting.objects.none()
        
        qs = InterventionMeeting.objects.filter(
            student_id=student_id
        ).select_related(
            'student', 'created_by'
        ).prefetch_related(
            Prefetch('progress_updates', queryset=ProgressUpdate.objects.select_related('created_by'))
        )
        
        # Form masters see only their own meetings
        if user.role == 'form_master':
            qs = qs.filter(created_by=user)
        
        return qs


# =====================================================
# RECURRING ABSENCE DETECTION
# =====================================================
class RecurringAbsenceDetectionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role not in ['form_master', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Find students with multiple interventions
        students_with_recurring = InterventionMeeting.objects.values(
            'student', 'student__full_name', 'student__student_id'
        ).annotate(
            intervention_count=Count('id'),
            open_count=Count('id', filter=Q(status__in=['open', 'monitoring', 'improving', 'not_improving']))
        ).filter(
            intervention_count__gte=2
        ).order_by('-intervention_count')
        
        # Filter by form master if not admin
        if user.role == 'form_master':
            students_with_recurring = students_with_recurring.filter(created_by=user)
        
        return Response({
            'recurring_students': list(students_with_recurring),
            'count': len(students_with_recurring)
        })


# =====================================================
# DASHBOARD STATISTICS
# =====================================================
class InterventionDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role not in ['form_master', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Base queryset
        qs = InterventionMeeting.objects.all()
        
        if user.role == 'form_master':
            qs = qs.filter(created_by=user)
        
        # Calculate statistics
        total_meetings = qs.count()
        open_cases = qs.filter(status='open').count()
        monitoring = qs.filter(status='monitoring').count()
        improving = qs.filter(status='improving').count()
        not_improving = qs.filter(status='not_improving').count()
        escalated = qs.filter(status='escalated').count()
        closed = qs.filter(status='closed').count()
        
        high_urgency = qs.filter(urgency_level='high', status__in=['open', 'monitoring']).count()
        
        # Overdue follow-ups
        overdue = qs.filter(
            follow_up_date__lt=timezone.now().date(),
            status__in=['open', 'monitoring', 'improving', 'not_improving']
        ).count()
        
        return Response({
            'total_meetings': total_meetings,
            'by_status': {
                'open': open_cases,
                'monitoring': monitoring,
                'improving': improving,
                'not_improving': not_improving,
                'escalated': escalated,
                'closed': closed,
            },
            'high_urgency': high_urgency,
            'overdue_followups': overdue,
        })
