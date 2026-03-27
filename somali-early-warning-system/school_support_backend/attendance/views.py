import logging
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

logger = logging.getLogger(__name__)


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
        period = serializer.validated_data.get("period", "1")

        # Check 1: Teacher must be assigned to this class/subject
        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=classroom
        ).exists():
            raise PermissionDenied("You are not assigned to this class/subject.")

        # Check 2: Period must match the timetable for this day
        from academics.schedule_models import SchoolTimetable
        day_of_week = attendance_date.strftime('%A').lower()
        timetable_slot = SchoolTimetable.objects.filter(
            teacher=user,
            classroom=classroom,
            subject=subject,
            day_of_week=day_of_week,
            period=period,
            is_active=True
        ).first()

        if not timetable_slot:
            # Find what periods ARE valid for this teacher/class/subject/day
            valid_slots = SchoolTimetable.objects.filter(
                teacher=user,
                classroom=classroom,
                subject=subject,
                day_of_week=day_of_week,
                is_active=True
            ).values_list('period', flat=True)

            if valid_slots.exists():
                valid_str = ', '.join([f'Period {p}' for p in sorted(valid_slots)])
                raise PermissionDenied(
                    f"Period {period} is not scheduled for {subject.name} in {classroom.name} "
                    f"on {day_of_week.capitalize()}. "
                    f"Your scheduled period(s) today: {valid_str}."
                )
            else:
                raise PermissionDenied(
                    f"{subject.name} is not scheduled in {classroom.name} "
                    f"on {day_of_week.capitalize()}. Check your timetable."
                )

        # Check 3: No duplicate session for same class/subject/period/date
        if AttendanceSession.objects.filter(
            classroom=classroom,
            subject=subject,
            teacher=user,
            attendance_date=attendance_date,
            period=period
        ).exists():
            raise PermissionDenied(
                f"Attendance already recorded for {classroom.name} - {subject.name} "
                f"on {attendance_date} (Period {period}). Edit the existing record instead."
            )

        try:
            with transaction.atomic():
                session = serializer.save(teacher=user)

                try:
                    update_risk_after_session(session)
                except Exception:
                    logger.exception("Risk update failed for session %s", session.session_id)

                try:
                    check_and_send_absence_alerts(session)
                except Exception:
                    logger.exception("Absence alert failed for session %s", session.session_id)

                try:
                    invalidate_teacher_cache(user.id)
                except Exception:
                    logger.exception("Cache invalidation failed for user %s", user.id)

        except PermissionDenied:
            raise
        except Exception as e:
            if 'Duplicate entry' in str(e):
                raise PermissionDenied("Attendance already recorded for this class, subject, date and period.")
            raise


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
# Today's Already-Submitted Sessions
# -----------------------------------
class TodaySubmittedSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'teacher':
            return Response({'submitted': []}, status=200)

        from datetime import date
        today = date.today()
        sessions = AttendanceSession.objects.filter(
            teacher=user,
            attendance_date=today
        ).values('classroom_id', 'subject_id', 'period')

        return Response({'submitted': list(sessions)})


# -----------------------------------
# Valid Periods for Today
# -----------------------------------
class TodayValidPeriodsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'teacher':
            return Response({'error': 'Teachers only'}, status=403)

        classroom_id = request.query_params.get('classroom')
        subject_id = request.query_params.get('subject')

        if not classroom_id or not subject_id:
            return Response({'error': 'classroom and subject required'}, status=400)

        from academics.schedule_models import SchoolTimetable
        from datetime import date
        day_of_week = date.today().strftime('%A').lower()

        slots = SchoolTimetable.objects.filter(
            teacher=user,
            classroom_id=classroom_id,
            subject_id=subject_id,
            day_of_week=day_of_week,
            is_active=True
        ).values_list('period', flat=True)

        return Response({
            'day': day_of_week,
            'valid_periods': list(slots)
        })


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
        
        absences = AttendanceRecord.objects.filter(
            session__classroom=classroom,
            status__in=['absent', 'late']
        ).select_related(
            'student', 'session__subject', 'session'
        )
        
        if student_id:
            absences = absences.filter(student__student_id=student_id)
        
        absences = absences.order_by('-session__attendance_date', '-created_at')[:100]
        
        result = []
        for record in absences:
            result.append({                'date': record.session.attendance_date.strftime('%Y-%m-%d'),
                'time': record.created_at.strftime('%I:%M %p'),
                'subject': record.session.subject.name,
                'status': record.status,
                'remarks': record.remarks or ''
            })
        
        return Response(result)


# -----------------------------------
# Helper: Check Consecutive Absences
# -----------------------------------
def check_and_send_absence_alerts(session):
    absent_records = session.records.filter(status='absent').select_related('student')

    for record in absent_records:
        student = record.student
        subject = session.subject

        recent_records = AttendanceRecord.objects.filter(
            student=student,
            session__subject=subject
        ).order_by('-session__attendance_date', '-created_at')[:10]

        consecutive_absences = 0
        for rec in recent_records:
            if rec.status == 'absent':
                consecutive_absences += 1
            else:
                break

        if consecutive_absences >= 3:
            try:
                send_absence_alert(student, consecutive_absences, subject.name)
            except Exception:
                logger.exception("Email alert failed for student %s", student.student_id)
