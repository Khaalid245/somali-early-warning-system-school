from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from datetime import timedelta
from django.utils import timezone

from students.models import Student
from attendance.models import AttendanceRecord
from alerts.models import Alert
from interventions.models import InterventionCase
from risk.models import StudentRiskProfile, SubjectRiskInsight


class StudentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)

        # Basic info
        student_info = {
            "student_id": student.student_id,
            "full_name": student.full_name,
            "email": student.email,
            "phone": student.phone,
        }

        # Risk profile
        risk_data = {}
        if hasattr(student, 'risk_profile'):
            risk_data = {
                "risk_level": student.risk_profile.risk_level,
                "risk_score": float(student.risk_profile.risk_score),
                "last_calculated": student.risk_profile.last_calculated,
            }

        # Attendance summary
        total_records = AttendanceRecord.objects.filter(student=student).count()
        present = AttendanceRecord.objects.filter(student=student, status='present').count()
        absent = AttendanceRecord.objects.filter(student=student, status='absent').count()
        late = AttendanceRecord.objects.filter(student=student, status='late').count()

        attendance_rate = 0
        if total_records > 0:
            attendance_rate = round((present / total_records) * 100, 1)

        attendance_summary = {
            "total_sessions": total_records,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "attendance_rate": attendance_rate,
        }

        # Subject-wise performance
        subject_performance = list(
            SubjectRiskInsight.objects
            .filter(student=student)
            .select_related('subject')
            .values(
                'subject__name',
                'total_sessions',
                'absence_count',
                'late_count',
                'absence_rate'
            )
        )

        # Attendance trend (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_attendance = list(
            AttendanceRecord.objects
            .filter(student=student, session__attendance_date__gte=thirty_days_ago)
            .select_related('session')
            .order_by('-session__attendance_date')
            .values(
                'session__attendance_date',
                'session__subject__name',
                'status'
            )[:30]
        )

        # Alert history
        alert_history = list(
            Alert.objects
            .filter(student=student)
            .select_related('subject')
            .order_by('-alert_date')
            .values(
                'alert_id',
                'alert_type',
                'risk_level',
                'status',
                'alert_date',
                'subject__name'
            )
        )

        # Intervention history
        intervention_history = list(
            InterventionCase.objects
            .filter(student=student)
            .select_related('assigned_to')
            .order_by('-created_at')
            .values(
                'case_id',
                'status',
                'follow_up_date',
                'outcome_notes',
                'created_at',
                'assigned_to__name'
            )
        )

        return Response({
            "student_info": student_info,
            "risk_data": risk_data,
            "attendance_summary": attendance_summary,
            "subject_performance": subject_performance,
            "recent_attendance": recent_attendance,
            "alert_history": alert_history,
            "intervention_history": intervention_history,
        })
