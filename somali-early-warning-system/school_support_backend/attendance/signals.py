from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AttendanceRecord
from students.models import StudentEnrollment
from risk.services import update_risk_after_session


@receiver(post_save, sender=AttendanceRecord)
def trigger_risk_after_attendance_record(sender, instance, created, **kwargs):
    """
    Trigger risk calculation only when:
    - A new attendance record is created
    - AND all students in the session have been marked
    """

    if not created:
        return

    session = instance.session
    classroom = session.classroom

    # ✅ Get total ACTIVE enrolled students in this classroom
    total_students = StudentEnrollment.objects.filter(
        classroom=classroom,
        is_active=True
    ).count()

    # ✅ Count how many attendance records exist for this session
    recorded_students = session.records.count()

    # ✅ Only calculate risk when attendance is complete
    if total_students == recorded_students:
        update_risk_after_session(session)
