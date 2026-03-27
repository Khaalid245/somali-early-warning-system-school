"""
Email Notification Service — School Early Warning System
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _school_name():
    return getattr(settings, 'SCHOOL_NAME', 'School Early Warning System')

def _frontend_url():
    return getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

def _sender():
    return settings.DEFAULT_FROM_EMAIL

def _risk_label(attendance_rate):
    if attendance_rate >= 95: return 'Low'
    if attendance_rate >= 85: return 'Medium'
    if attendance_rate >= 75: return 'High'
    return 'Critical'

def _format_recent_absences(recent_absences):
    if not recent_absences:
        return '  No recent absences recorded.'
    lines = []
    for a in recent_absences[:5]:
        date_str = a['date'].strftime('%d %b %Y')
        status = 'Absent' if a['status'] == 'absent' else 'Late'
        lines.append(f'  {date_str} — {a["subject"]} ({status})')
    return '\n'.join(lines)

def _format_subject_breakdown(subject_breakdown):
    if not subject_breakdown:
        return '  No subject data available.'
    lines = []
    for subject, data in sorted(subject_breakdown.items(), key=lambda x: x[1]['count'], reverse=True):
        lines.append(f'  {subject}: {data["count"]} absence(s)')
    return '\n'.join(lines)

def _get_absence_details(student):
    from attendance.models import AttendanceRecord
    records = AttendanceRecord.objects.filter(
        student=student
    ).select_related('session__subject', 'session').order_by('-session__attendance_date')

    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    monthly = records.filter(session__attendance_date__gte=thirty_days_ago)
    monthly_absences = monthly.filter(status='absent').count()
    total = monthly.count()
    attendance_rate = 0
    if total > 0:
        attendance_rate = (monthly.filter(status='present').count() / total) * 100

    recent_absences = []
    for r in records[:10]:
        if r.status in ['absent', 'late']:
            recent_absences.append({
                'date': r.session.attendance_date,
                'subject': r.session.subject.name,
                'status': r.status,
            })

    subject_breakdown = {}
    for r in records.filter(status='absent')[:20]:
        s = r.session.subject.name
        if s not in subject_breakdown:
            subject_breakdown[s] = {'count': 0}
        subject_breakdown[s]['count'] += 1

    return {
        'monthly_absences': monthly_absences,
        'attendance_rate': attendance_rate,
        'recent_absences': recent_absences,
        'subject_breakdown': subject_breakdown,
    }


# ─── 1. Absence alert → Parent ────────────────────────────────────────────────

def send_absence_alert(student, consecutive_days, subject_name=None):
    """
    Triggered when a student has 3+ consecutive absences.
    Sends to: parent, form master, and admin (if 5+ days).
    """
    try:
        details = _get_absence_details(student)
        enrollment = student.enrollments.filter(is_active=True).first()
        if not enrollment or not enrollment.classroom.form_master:
            logger.warning(f'No form master for student {student.student_id}')
            return

        form_master = enrollment.classroom.form_master
        classroom   = enrollment.classroom.name
        today       = timezone.now().strftime('%d %B %Y')

        # ── Email to parent ──
        if student.parent_email:
            parent_name = student.parent_name or 'Parent/Guardian'
            parent_message = f"""Dear {parent_name},

We are writing to let you know that {student.full_name} has been absent from school for {consecutive_days} consecutive day(s).

Student: {student.full_name}
Class: {classroom}
Absences this month: {details['monthly_absences']} day(s)
Attendance rate: {details['attendance_rate']:.0f}%

Recent absences:
{_format_recent_absences(details['recent_absences'])}

What we ask of you:
  1. Please contact the school to explain the reason for the absences.
  2. If the absence is due to illness, please provide a medical note.
  3. We would like to arrange a short meeting to discuss how we can support {student.full_name}.

To reach us:
  Form Master: {form_master.name}
  Email: {form_master.email}
  Phone: {getattr(settings, 'SCHOOL_PHONE', 'Contact the school office')}

Thank you for your support.

{form_master.name}
Form Master, {classroom}
{_school_name()}
{today}
"""
            send_mail(
                subject=f'Attendance concern — {student.full_name}',
                message=parent_message,
                from_email=_sender(),
                recipient_list=[student.parent_email],
                fail_silently=False,
            )
            logger.info(f'Absence alert sent to parent: {student.parent_email}')

        # ── Email to form master ──
        fm_message = f"""Dear {form_master.name},

This is an automatic notification from the Early Warning System.

{student.full_name} (Class: {classroom}) has been absent for {consecutive_days} consecutive day(s).

Attendance summary (last 30 days):
  Absences: {details['monthly_absences']} day(s)
  Attendance rate: {details['attendance_rate']:.0f}%
  Risk level: {_risk_label(details['attendance_rate'])}

Recent absences:
{_format_recent_absences(details['recent_absences'])}

Subjects affected:
{_format_subject_breakdown(details['subject_breakdown'])}

Suggested next steps:
  1. A notification has been sent to the parent automatically.
  2. Please follow up if you have not heard back within 24 hours.
  3. If the pattern continues, consider opening an intervention case.

View the student's profile:
{_frontend_url()}/form-master/dashboard

{_school_name()}
{today}
"""
        send_mail(
            subject=f'Absence alert — {student.full_name} ({consecutive_days} day(s))',
            message=fm_message,
            from_email=_sender(),
            recipient_list=[form_master.email],
            fail_silently=False,
        )
        logger.info(f'Absence alert sent to form master: {form_master.email}')

        # ── Email to admin if 5+ consecutive days ──
        if consecutive_days >= 5:
            _send_critical_absence_to_admin(student, consecutive_days, details, enrollment)

    except Exception as e:
        logger.error(f'Failed to send absence alert for student {student.student_id}: {e}')


def _send_critical_absence_to_admin(student, consecutive_days, details, enrollment):
    try:
        from users.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        admin_emails = [a.email for a in admins]
        if not admin_emails:
            return

        classroom   = enrollment.classroom.name if enrollment else 'Unknown'
        form_master = enrollment.classroom.form_master.name if enrollment and enrollment.classroom.form_master else 'Unassigned'
        today       = timezone.now().strftime('%d %B %Y')

        message = f"""Dear Administrator,

This is an urgent notification. A student has been absent for {consecutive_days} consecutive days and requires your attention.

Student: {student.full_name}
Class: {classroom}
Form Master: {form_master}
Consecutive absences: {consecutive_days} days
Absences this month: {details['monthly_absences']} days
Attendance rate: {details['attendance_rate']:.0f}%

The form master has been notified. Please review this case and consider whether further action is needed, such as a welfare check or parent meeting.

View the case in the admin dashboard:
{_frontend_url()}/admin/dashboard

{_school_name()}
{today}
"""
        send_mail(
            subject=f'Urgent: {student.full_name} — {consecutive_days} consecutive absences',
            message=message,
            from_email=_sender(),
            recipient_list=admin_emails,
            fail_silently=False,
        )
        logger.info(f'Critical absence alert sent to {len(admin_emails)} admin(s)')
    except Exception as e:
        logger.error(f'Failed to send critical absence alert to admin: {e}')


# ─── 2. New high-risk alert → Form master ─────────────────────────────────────

def send_alert_notification(alert):
    """Sent when a high or critical risk alert is created for a student."""
    try:
        if not alert.assigned_to or not alert.assigned_to.email:
            logger.warning(f'No form master email for alert {alert.alert_id}')
            return

        today   = alert.alert_date.strftime('%d %B %Y')
        message = f"""Dear {alert.assigned_to.name},

A new attendance alert has been raised for one of your students.

Student: {alert.student.full_name}
Risk level: {alert.risk_level.capitalize()}
Alert type: {alert.alert_type.replace('_', ' ').capitalize()}
Date: {today}

Please log in to review this alert and decide on next steps:
{_frontend_url()}/form-master/dashboard

{_school_name()}
"""
        send_mail(
            subject=f'New {alert.risk_level} risk alert — {alert.student.full_name}',
            message=message,
            from_email=_sender(),
            recipient_list=[alert.assigned_to.email],
            fail_silently=True,
        )
        logger.info(f'Alert notification sent to {alert.assigned_to.email}')
    except Exception as e:
        logger.error(f'Failed to send alert notification for alert {alert.alert_id}: {e}')


# ─── 3. Case escalated → All admins ───────────────────────────────────────────

def send_case_escalation_notification(case):
    """Sent to all admins when a form master escalates a case."""
    try:
        from users.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        admin_emails = [a.email for a in admins]
        if not admin_emails:
            return

        form_master = case.assigned_to.name if case.assigned_to else 'Form Master'
        days_open   = (timezone.now().date() - case.created_at.date()).days
        today       = timezone.now().strftime('%d %B %Y')

        message = f"""Dear Administrator,

A case has been escalated and needs your review.

Student: {case.student.full_name}
Case ID: #{case.case_id}
Escalated by: {form_master}
Days open: {days_open}
Reason: {case.escalation_reason or 'No reason provided'}

Please log in to review and take action:
{_frontend_url()}/admin/dashboard

{_school_name()}
{today}
"""
        send_mail(
            subject=f'Case escalated — {case.student.full_name} (#{case.case_id})',
            message=message,
            from_email=_sender(),
            recipient_list=admin_emails,
            fail_silently=True,
        )
        logger.info(f'Escalation notification sent to {len(admin_emails)} admin(s) for case {case.case_id}')
    except Exception as e:
        logger.error(f'Failed to send escalation notification for case {case.case_id}: {e}')


# ─── 4. Case resolved → Form master ───────────────────────────────────────────

def send_case_resolved_notification(case):
    """Sent to the form master when a case is closed."""
    try:
        if not case.assigned_to or not case.assigned_to.email:
            return

        today   = timezone.now().strftime('%d %B %Y')
        message = f"""Dear {case.assigned_to.name},

The intervention case for {case.student.full_name} has been closed.

Case ID: #{case.case_id}
Student: {case.student.full_name}
Closed on: {today}
Notes: {case.outcome_notes or 'No notes recorded'}

Please continue to monitor this student's attendance over the coming weeks.

{_school_name()}
"""
        send_mail(
            subject=f'Case closed — {case.student.full_name} (#{case.case_id})',
            message=message,
            from_email=_sender(),
            recipient_list=[case.assigned_to.email],
            fail_silently=True,
        )
        logger.info(f'Resolution notification sent to {case.assigned_to.email} for case {case.case_id}')
    except Exception as e:
        logger.error(f'Failed to send resolution notification for case {case.case_id}: {e}')


# ─── 5. Attendance reminder → Teacher ─────────────────────────────────────────

def send_attendance_reminder_to_teacher(teacher, missing_assignments):
    """Sent to a teacher who has not recorded attendance for one or more classes today."""
    try:
        if not teacher.email:
            return

        today_str = timezone.now().strftime('%A, %d %B %Y')
        frontend_url = _frontend_url()

        missing_lines = '\n'.join(
            f'  • {a["classroom_name"]} — {a["subject_name"]} (Period {a["period"]})'
            for a in missing_assignments
        )

        message = f"""Dear {teacher.name},

Attendance has not yet been recorded for the following class(es) today ({today_str}):

{missing_lines}

Please log in and record attendance as soon as possible:
{frontend_url}/teacher/attendance

If you have already done this, please ignore this message.

{_school_name()}
"""
        send_mail(
            subject=f'Reminder: attendance not recorded — {today_str}',
            message=message,
            from_email=_sender(),
            recipient_list=[teacher.email],
            fail_silently=False,
        )
        logger.info(f'Attendance reminder sent to {teacher.email}')
    except Exception as e:
        logger.error(f'Failed to send attendance reminder to {getattr(teacher, "email", "unknown")}: {e}')
        raise
