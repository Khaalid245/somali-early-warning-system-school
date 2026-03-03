"""
Email Notification Service
Sends automatic emails for attendance alerts, interventions, and escalations
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def send_absence_alert(student, consecutive_days):
    """
    Send email when student is absent 3+ consecutive days
    Recipients: Parent + Form Master
    """
    try:
        # Get form master from active enrollment
        enrollment = student.enrollments.filter(is_active=True).first()
        if not enrollment or not enrollment.classroom.form_master:
            logger.warning(f"No form master found for student {student.student_id}")
            return
        
        form_master = enrollment.classroom.form_master
        
        # Email to parent
        if student.parent_email:
            send_mail(
                subject=f'Attendance Alert: {student.full_name}',
                message=f"""Dear {student.parent_name or 'Parent/Guardian'},

Re: Attendance Alert for {student.full_name}

We are writing to inform you that {student.full_name} has been absent from school for {consecutive_days} consecutive days.

Regular attendance is essential for academic success. We kindly request you to contact the school to discuss this matter.

For any concerns or clarifications, please reach out to:

Form Master: {form_master.name}
Email: {form_master.email}

Thank you for your cooperation.

Sincerely,
School Administration""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[student.parent_email],
                fail_silently=False,
            )
            logger.info(f"Absence alert sent to parent: {student.parent_email}")
        
        # Email to form master
        send_mail(
            subject=f'Student Absence Alert: {student.full_name} - {consecutive_days} Days',
            message=f"""Dear {form_master.name},

Re: Student Absence Alert

Student Name: {student.full_name}
Admission Number: {student.admission_number}
Classroom: {enrollment.classroom.name}
Consecutive Absences: {consecutive_days} days

This is an automated alert from the Early Warning System. Please review the student's attendance record and consider appropriate intervention measures.

You may access the dashboard at: {settings.FRONTEND_URL}/form-master/dashboard

Best regards,
School Early Warning System""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[form_master.email],
            fail_silently=False,
        )
        logger.info(f"Absence alert sent to form master: {form_master.email}")
        
    except Exception as e:
        logger.error(f"Failed to send absence alert for student {student.student_id}: {e}")


def send_alert_notification(alert):
    """
    Send email when high-risk alert is created
    Recipients: Parent + Form Master
    """
    try:
        student = alert.student
        
        # Email to parent
        if student.parent_email:
            send_mail(
                subject=f'Academic Alert: {student.full_name}',
                message=f"""Dear {student.parent_name or 'Parent/Guardian'},

Re: Academic Performance Alert

We wish to inform you that an academic alert has been issued for {student.full_name}.

Alert Details:
- Type: {alert.get_alert_type_display()}
- Risk Level: {alert.risk_level.upper()}
- Subject: {alert.subject.name if alert.subject else 'General'}
- Date: {alert.alert_date.strftime('%B %d, %Y')}

We recommend scheduling a meeting with the form master to discuss appropriate support strategies for your child.

Thank you for your attention to this matter.

Sincerely,
School Administration""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[student.parent_email],
                fail_silently=False,
            )
            logger.info(f"Alert notification sent to parent: {student.parent_email}")
        
        # Email to assigned teacher/form master
        if alert.assigned_to:
            send_mail(
                subject=f'New Alert Assigned: {student.full_name}',
                message=f"""Dear {alert.assigned_to.name},

Re: New Alert Assignment

A new academic alert has been assigned to you for review.

Student Information:
- Name: {student.full_name}
- Admission Number: {student.admission_number}
- Alert Type: {alert.get_alert_type_display()}
- Risk Level: {alert.risk_level.upper()}
- Created By: {alert.created_by.name if alert.created_by else 'System'}

Please review this alert and take appropriate action.

Access Dashboard: {settings.FRONTEND_URL}/dashboard

Best regards,
School Early Warning System""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert.assigned_to.email],
                fail_silently=False,
            )
            logger.info(f"Alert notification sent to assigned user: {alert.assigned_to.email}")
        
    except Exception as e:
        logger.error(f"Failed to send alert notification for alert {alert.alert_id}: {e}")


def send_case_escalation_notification(case):
    """
    Send email when case is escalated to admin
    Recipients: Admin + Parent
    """
    try:
        from users.models import User
        student = case.student
        
        # Email to all admins
        admins = User.objects.filter(role='admin', is_active=True)
        admin_emails = [admin.email for admin in admins]
        
        if admin_emails:
            send_mail(
                subject=f'Case Escalation: {student.full_name}',
                message=f"""Dear Administrator,

Re: Urgent Case Escalation

A student intervention case has been escalated to administration for immediate attention.

Student Information:
- Name: {student.full_name}
- Admission Number: {student.admission_number}
- Form Master: {case.assigned_to.name if case.assigned_to else 'Unassigned'}
- Days Open: {(timezone.now().date() - case.created_at.date()).days}
- Escalation Reason: {case.escalation_reason or 'Not specified'}

Please review this case and take appropriate administrative action.

Access Dashboard: {settings.FRONTEND_URL}/admin/dashboard

Best regards,
School Early Warning System""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=False,
            )
            logger.info(f"Case escalation sent to {len(admin_emails)} admins")
        
        # Email to parent
        if student.parent_email:
            send_mail(
                subject=f'Case Update: {student.full_name}',
                message=f"""Dear {student.parent_name or 'Parent/Guardian'},

Re: Student Support Case Update

We wish to inform you that the intervention case for {student.full_name} has been escalated to school administration for additional support.

This action ensures that your child receives comprehensive assistance from our administrative team.

A school administrator will contact you shortly to discuss the next steps.

Thank you for your cooperation.

Sincerely,
School Administration""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[student.parent_email],
                fail_silently=False,
            )
            logger.info(f"Case escalation notification sent to parent: {student.parent_email}")
        
    except Exception as e:
        logger.error(f"Failed to send case escalation notification for case {case.case_id}: {e}")


def send_case_resolved_notification(case):
    """
    Send email when case is successfully resolved
    Recipients: Parent
    """
    try:
        student = case.student
        
        if student.parent_email:
            send_mail(
                subject=f'Case Resolution: {student.full_name}',
                message=f"""Dear {student.parent_name or 'Parent/Guardian'},

Re: Intervention Case Resolution

We are pleased to inform you that the intervention case for {student.full_name} has been successfully resolved.

Resolution Summary: {case.resolution_notes or 'Case closed successfully'}

We appreciate your cooperation and support throughout this process. Your involvement has been instrumental in achieving this positive outcome.

Should you have any questions or concerns, please do not hesitate to contact us.

Thank you.

Sincerely,
School Administration""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[student.parent_email],
                fail_silently=False,
            )
            logger.info(f"Case resolved notification sent to parent: {student.parent_email}")
        
    except Exception as e:
        logger.error(f"Failed to send case resolved notification for case {case.case_id}: {e}")
