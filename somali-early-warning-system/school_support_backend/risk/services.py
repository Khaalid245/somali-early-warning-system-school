from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum

from attendance.models import AttendanceRecord
from students.models import StudentEnrollment
from .models import StudentRiskProfile, SubjectRiskInsight
from alerts.models import Alert
from interventions.models import InterventionCase


# =====================================================
# MAIN ENTRY POINT
# =====================================================
def update_risk_after_session(session):

    records = session.records.select_related("student")

    for record in records:
        student = record.student
        subject = session.subject

        _update_subject_insight(student, subject)

        subject_streak = _calculate_subject_streak(student, subject)
        full_day_streak = _calculate_full_day_streak(student)

        _update_overall_student_risk(
            student,
            subject_streak,
            full_day_streak
        )


# =====================================================
# SUBJECT ANALYTICS
# =====================================================
def _update_subject_insight(student, subject):

    records = AttendanceRecord.objects.filter(
        student=student,
        session__subject=subject
    )

    total_sessions = records.count()
    absence_count = records.filter(status="absent").count()
    late_count = records.filter(status="late").count()

    absence_rate = Decimal("0.00")

    if total_sessions > 0:
        absence_rate = (
            Decimal(absence_count) / Decimal(total_sessions)
        ) * Decimal("100")

    insight, _ = SubjectRiskInsight.objects.get_or_create(
        student=student,
        subject=subject
    )

    insight.total_sessions = total_sessions
    insight.absence_count = absence_count
    insight.late_count = late_count
    insight.absence_rate = absence_rate.quantize(Decimal("0.01"))
    insight.last_calculated = timezone.now()
    insight.save()


# =====================================================
# SUBJECT STREAK
# =====================================================
def _calculate_subject_streak(student, subject):

    records = AttendanceRecord.objects.filter(
        student=student,
        session__subject=subject
    ).order_by("-session__attendance_date")

    streak = 0

    for record in records:
        if record.status == "absent":
            streak += 1
        else:
            break

    return streak


# =====================================================
# FULL DAY STREAK
# =====================================================
def _calculate_full_day_streak(student):

    dates = (
        AttendanceRecord.objects
        .filter(student=student)
        .order_by("-session__attendance_date")
        .values_list("session__attendance_date", flat=True)
        .distinct()
    )

    streak = 0

    for date in dates:
        records_that_day = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date=date
        )

        if records_that_day.exists() and all(
            r.status == "absent" for r in records_that_day
        ):
            streak += 1
        else:
            break

    return streak


# =====================================================
# OVERALL RISK ENGINE
# =====================================================
def _update_overall_student_risk(student, subject_streak, full_day_streak):

    insights = SubjectRiskInsight.objects.filter(student=student)

    avg_absence_rate = Decimal("0.00")

    if insights.exists():
        total_rate = insights.aggregate(
            total=Sum("absence_rate")
        )["total"] or Decimal("0.00")

        avg_absence_rate = total_rate / Decimal(insights.count())

    profile, _ = StudentRiskProfile.objects.get_or_create(
        student=student
    )

    risk_score = avg_absence_rate

    if subject_streak >= 7:
        risk_score += Decimal("40")
    elif subject_streak >= 5:
        risk_score += Decimal("25")
    elif subject_streak >= 3:
        risk_score += Decimal("15")

    if full_day_streak >= 5:
        risk_score += Decimal("40")
    elif full_day_streak >= 3:
        risk_score += Decimal("25")

    risk_score = risk_score.quantize(Decimal("0.01"))

    old_level = profile.risk_level

    if risk_score >= Decimal("75"):
        new_level = "critical"
    elif risk_score >= Decimal("55"):
        new_level = "high"
    elif risk_score >= Decimal("30"):
        new_level = "medium"
    else:
        new_level = "low"

    profile.risk_score = risk_score
    profile.risk_level = new_level
    profile.last_calculated = timezone.now()
    profile.save()

    _handle_alerts_and_interventions(student, old_level, new_level)


# =====================================================
# ALERT + INTERVENTION AUTOMATION
# =====================================================
def _handle_alerts_and_interventions(student, old_level, new_level):

    enrollment = (
        StudentEnrollment.objects
        .filter(student=student, is_active=True)
        .select_related("student", "classroom")
        .first()
    )

    form_master = None
    if enrollment and enrollment.classroom:
        form_master = enrollment.classroom.form_master

    active_alert = (
        Alert.objects
        .filter(
            student=student,
            alert_type="attendance",
            status__in=["active", "under_review", "escalated"]
        )
        .order_by("-alert_date")
        .first()
    )

    # ------------------------------------------------
    # HIGH OR CRITICAL → ALERT + INTERVENTION
    # ------------------------------------------------
    if new_level in ["high", "critical"]:

        if not active_alert:
            active_alert = Alert.objects.create(
                student=student,
                alert_type="attendance",
                risk_level=new_level,
                status="active",
                assigned_to=form_master
            )
        else:
            if active_alert.risk_level != new_level:
                active_alert.risk_level = new_level
                active_alert.save()

        # ------------------------------------------------
        # CREATE INTERVENTION IF NOT EXISTS
        # ------------------------------------------------
        existing_case = InterventionCase.objects.filter(
            student=student,
            alert=active_alert,
            status__in=["open", "in_progress", "awaiting_parent"]
        ).first()

        if not existing_case:
            InterventionCase.objects.create(
                student=student,
                alert=active_alert,
                assigned_to=form_master,
                status="open"
            )

    # ------------------------------------------------
    # AUTO RESOLVE
    # ------------------------------------------------
    elif new_level in ["medium", "low"] and active_alert:
        active_alert.status = "resolved"
        active_alert.save()

        # Close open intervention cases
        InterventionCase.objects.filter(
            student=student,
            alert=active_alert,
            status__in=["open", "in_progress", "awaiting_parent"]
        ).update(status="closed")
