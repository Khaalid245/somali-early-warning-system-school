from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AttendanceRecord
from students.models import StudentEnrollment
from risk.services import update_risk_after_session
from notifications.email_service import send_absence_alert


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
        
    # ✅ Check for consecutive absences and send email alerts
    if instance.status == 'absent':
        check_consecutive_absences(instance.student)


def check_consecutive_absences(student):
    """
    International standard: alert when student misses 3+ consecutive FULL DAYS.
    A full day = ALL sessions on that date are absent.
    """
    # Get distinct dates ordered most recent first
    dates = (
        AttendanceRecord.objects
        .filter(student=student)
        .values_list('session__attendance_date', flat=True)
        .distinct()
        .order_by('-session__attendance_date')
    )

    consecutive_full_days = 0
    for d in dates:
        day_records = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date=d
        )
        all_absent = day_records.exists() and all(
            r.status == 'absent' for r in day_records
        )
        if all_absent:
            consecutive_full_days += 1
        else:
            break

    if consecutive_full_days >= 3:
        _create_consecutive_absence_alert(student, consecutive_full_days)
        send_absence_alert(student, consecutive_full_days)


def _create_consecutive_absence_alert(student, consecutive_days):
    """
    Create an Alert record for consecutive full-day absences.
    Avoids duplicates: skips if an active consecutive-absence alert already exists.
    """
    from alerts.models import Alert
    from students.models import StudentEnrollment

    # Avoid duplicate active alerts for the same student
    already_exists = Alert.objects.filter(
        student=student,
        alert_type='attendance',
        status__in=['active', 'under_review'],
    ).exists()
    if already_exists:
        return

    risk_level = 'critical' if consecutive_days >= 5 else 'high'

    # Find the form master assigned to this student's classroom
    enrollment = StudentEnrollment.objects.filter(
        student=student, is_active=True
    ).select_related('classroom__form_master').first()
    form_master = enrollment.classroom.form_master if enrollment and enrollment.classroom.form_master else None

    Alert.objects.create(
        student=student,
        alert_type='attendance',
        risk_level=risk_level,
        status='active',
        assigned_to=form_master,
    )