from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q
from datetime import timedelta

from .models import AttendanceSession, AttendanceRecord
from .serializers import AttendanceSessionSerializer

from academics.models import TeachingAssignment
from risk.services import update_risk_after_session
from dashboard.cache_utils import invalidate_teacher_cache
from notifications.email_service import send_absence_alert


# -----------------------------------
# Attendance Session Create & List
# -----------------------------------
class AttendanceSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return AttendanceSession.objects.prefetch_related('records__student').all().order_by("-attendance_date")

        if user.role == "teacher":
            return AttendanceSession.objects.prefetch_related('records__student').filter(
                teacher=user
            ).order_by("-attendance_date")

        if user.role == "form_master":
            return AttendanceSession.objects.prefetch_related('records__student').filter(
                classroom__form_master=user
            ).order_by("-attendance_date")

        return AttendanceSession.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "teacher":
            raise PermissionDenied("Only teachers can record attendance.")

        classroom = serializer.validated_data["classroom"]
        subject = serializer.validated_data["subject"]
        attendance_date = serializer.validated_data["attendance_date"]

        # Validate teacher assignment
        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=classroom
        ).exists():
            raise PermissionDenied("You are not assigned to this class/subject.")

        # Prevent duplicate session
        if AttendanceSession.objects.filter(
            classroom=classroom,
            subject=subject,
            attendance_date=attendance_date
        ).exists():
            raise PermissionDenied(
                "Attendance already recorded for this class, subject and date."
            )

        # Save session with transaction safety
        with transaction.atomic():
            session = serializer.save()
            # Call risk engine (SERVICE LAYER)
            update_risk_after_session(session)
            # Check for consecutive absences and send alerts
            check_and_send_absence_alerts(session)
            # Invalidate teacher cache after successful save
            invalidate_teacher_cache(user.id)


# -----------------------------------
# Attendance Session Detail
# -----------------------------------
class AttendanceSessionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AttendanceSession.objects.prefetch_related('records__student').all()

    def perform_update(self, serializer):
        user = self.request.user
        session = self.get_object()

        if user.role != "teacher" or session.teacher != user:
            raise PermissionDenied("You can only edit your own attendance sessions.")

        with transaction.atomic():
            serializer.save()
            update_risk_after_session(session)
            invalidate_teacher_cache(user.id)


# -----------------------------------
# Student Absence Details
# -----------------------------------
class StudentAbsenceDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role != "form_master":
            return Response({"error": "Only form masters can access this."}, status=403)
        
        classroom = getattr(user, 'managed_classroom', None)
        if not classroom:
            return Response({"error": "No classroom assigned."}, status=404)
        
        student_id = request.query_params.get('student_id')
        print(f"Fetching absences for student_id: {student_id}, classroom: {classroom.name}")
        
        absences = AttendanceRecord.objects.filter(
            session__classroom=classroom,
            status__in=['absent', 'late']
        ).select_related(
            'student', 'session__subject', 'session'
        )
        
        if student_id:
            absences = absences.filter(student__student_id=student_id)
        
        absences = absences.order_by('-session__attendance_date', '-created_at')[:100]
        
        print(f"Found {absences.count()} absence records")
        
        result = []
        for record in absences:
            result.append({
                'date': record.session.attendance_date.strftime('%Y-%m-%d'),
                'time': record.created_at.strftime('%I:%M %p'),
                'subject': record.session.subject.name,
                'status': record.status,
                'remarks': record.remarks or ''
            })
        
        print(f"Returning {len(result)} records")
        return Response(result)


# -----------------------------------
# Helper: Check Consecutive Absences
# -----------------------------------
def check_and_send_absence_alerts(session):
    """
    Check if any student has 3+ consecutive absences and send email alert
    Called automatically after attendance is recorded
    """
    from students.models import Student
    from django.utils import timezone
    
    # Get all absent students from this session
    absent_records = session.records.filter(status='absent').select_related('student')
    
    for record in absent_records:
        student = record.student
        
        # Get last 10 attendance records for this student
        recent_records = AttendanceRecord.objects.filter(
            student=student
        ).order_by('-session__attendance_date', '-created_at')[:10]
        
        # Count consecutive absences from most recent
        consecutive_absences = 0
        for rec in recent_records:
            if rec.status == 'absent':
                consecutive_absences += 1
            else:
                break  # Stop at first non-absent
        
        # Send alert if 3+ consecutive absences
        if consecutive_absences >= 3:
            print(f"\n🚨 ALERT: {student.full_name} has {consecutive_absences} consecutive absences!")
            print(f"📧 Sending email to parent: {student.parent_email or 'NO EMAIL'}")
            send_absence_alert(student, consecutive_absences)
            print(f"✅ Email sent successfully!\n")
