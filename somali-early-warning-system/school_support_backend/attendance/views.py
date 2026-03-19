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

        # Check for existing attendance session (include period and teacher in validation)
        period = serializer.validated_data.get("period", "1")
        existing_sessions = AttendanceSession.objects.filter(
            classroom=classroom,
            subject=subject,
            teacher=user,  # FIXED: Include teacher to allow same subject in different classes
            attendance_date=attendance_date,
            period=period
        )
        
        print(f"[DEBUG] Checking for duplicates: classroom={classroom.class_id}, subject={subject.subject_id}, teacher={user.email}, date={attendance_date}, period={period}")
        print(f"[DEBUG] Found {existing_sessions.count()} existing sessions")
        
        if existing_sessions.exists():
            existing_session = existing_sessions.first()
            print(f"[DEBUG] Existing session found: ID={existing_session.session_id}, Teacher={existing_session.teacher.email}")
            raise PermissionDenied(
                f"Attendance already recorded for {classroom.name} - {subject.name} on {attendance_date} (Period {period}). "
                f"Please edit the existing record instead."
            )

        # Handle database unique constraint for presentation
        try:
            # Save session with transaction safety
            with transaction.atomic():
                session = serializer.save(teacher=user)
                
                # Call risk engine (SERVICE LAYER) - wrapped in try-catch
                try:
                    update_risk_after_session(session)
                    print("Risk engine updated successfully")
                except Exception as e:
                    print(f"Risk engine failed: {e}")
                    # Don't fail the attendance submission
                    pass
                    
                # Check for consecutive absences and send alerts - wrapped in try-catch
                try:
                    check_and_send_absence_alerts(session)
                    print("Absence alerts checked successfully")
                except Exception as e:
                    print(f"Absence alert check failed: {e}")
                    # Don't fail the attendance submission
                    pass
                    
                # Invalidate teacher cache after successful save - wrapped in try-catch
                try:
                    invalidate_teacher_cache(user.id)
                    print("Teacher cache invalidated successfully")
                except Exception as e:
                    print(f"Cache invalidation failed: {e}")
                    # Don't fail the attendance submission
                    pass
                    
        except Exception as e:
            print(f"Attendance session creation failed: {e}")
            if 'Duplicate entry' in str(e):
                raise PermissionDenied("Attendance already recorded for this class, subject, date and period.")
            else:
                raise e


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
        subject = session.subject  # Get the subject from current session
        
        print(f"[DEBUG] Checking consecutive absences for {student.full_name} in {subject.name}")
        
        # FIXED: Get attendance records for THIS SUBJECT ONLY (not all subjects mixed)
        recent_records = AttendanceRecord.objects.filter(
            student=student,
            session__subject=subject  # CRITICAL FIX: Subject-specific calculation
        ).order_by('-session__attendance_date', '-created_at')[:10]
        
        print(f"[DEBUG] Found {recent_records.count()} recent records for {subject.name}")
        
        # Count consecutive absences from most recent (subject-specific)
        consecutive_absences = 0
        for rec in recent_records:
            if rec.status == 'absent':
                consecutive_absences += 1
                print(f"[DEBUG] Absence #{consecutive_absences} on {rec.session.attendance_date}")
            else:
                print(f"[DEBUG] Present on {rec.session.attendance_date} - breaking streak")
                break  # Stop at first non-absent
        
        # Send alert if 3+ consecutive absences IN THE SAME SUBJECT
        if consecutive_absences >= 3:
            print(f"\n🚨 SUBJECT-SPECIFIC ALERT: {student.full_name} has {consecutive_absences} consecutive absences in {subject.name}!")
            print(f"📧 Sending email to parent: {student.parent_email or 'NO EMAIL'}")
            
            try:
                send_absence_alert(student, consecutive_absences, subject.name)  # Include subject in alert
                print(f"✅ Email sent successfully for {subject.name} absences!\n")
            except Exception as e:
                print(f"❌ Email sending failed: {e}")
        else:
            print(f"[DEBUG] Only {consecutive_absences} consecutive absences in {subject.name} - no alert needed")
