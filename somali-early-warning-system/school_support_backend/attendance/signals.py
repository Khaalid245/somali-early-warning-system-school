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
    Check if student has 3+ consecutive absences and send email alert
    """
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
