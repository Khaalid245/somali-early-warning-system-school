from decimal import Decimal
from django.utils import timezone
from django.db.models import Q

from attendance.models import AttendanceRecord
from .models import StudentRiskProfile, SubjectRiskInsight
from alerts.models import Alert


# =====================================================
# MAIN ENTRY POINT
# =====================================================
def update_risk_after_session(session):
    """
    Triggered automatically after attendance session is complete.
    Handles:
    - Subject analytics update
    - Consecutive absence detection
    - Overall risk calculation
    - Alert management
    """

    for record in session.records.select_related("student"):
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
# SUBJECT CONSECUTIVE STREAK
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
# FULL DAY CONSECUTIVE STREAK
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
# OVERALL RISK ENGINE (HYBRID MODEL)
# =====================================================
def _update_overall_student_risk(student, subject_streak, full_day_streak):

    insights = SubjectRiskInsight.objects.filter(student=student)

    avg_absence_rate = Decimal("0.00")

    if insights.exists():
        total_rate = sum(
            insight.absence_rate for insight in insights
        )
        avg_absence_rate = (
            total_rate / Decimal(insights.count())
        )

    profile, _ = StudentRiskProfile.objects.get_or_create(
        student=student
    )

    risk_score = avg_absence_rate

    # --------------------------------------------
    # SUBJECT STREAK WEIGHT
    # --------------------------------------------
    if subject_streak >= 7:
        risk_score += Decimal("40")
    elif subject_streak >= 5:
        risk_score += Decimal("25")
    elif subject_streak >= 3:
        risk_score += Decimal("15")

    # --------------------------------------------
    # FULL DAY STREAK WEIGHT (STRONGER)
    # --------------------------------------------
    if full_day_streak >= 5:
        risk_score += Decimal("40")
    elif full_day_streak >= 3:
        risk_score += Decimal("25")

    risk_score = risk_score.quantize(Decimal("0.01"))

    old_level = profile.risk_level

    # --------------------------------------------
    # RISK LEVEL MAPPING
    # --------------------------------------------
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

    _handle_alerts(student, old_level, new_level)


# =====================================================
# ALERT MANAGEMENT (INDUSTRY ESCALATION ENGINE)
# =====================================================
def _handle_alerts(student, old_level, new_level):

    active_alert = Alert.objects.filter(
        student=student,
        status="active"
    ).first()

    # ------------------------------------------------
    # CREATE OR ESCALATE ALERT
    # ------------------------------------------------
    if new_level in ["high", "critical"]:

        if active_alert:
            # Escalate if needed
            if active_alert.risk_level != new_level:
                active_alert.risk_level = new_level
                active_alert.updated_at = timezone.now()
                active_alert.save()
        else:
            Alert.objects.create(
                student=student,
                alert_type="attendance",
                risk_level=new_level,
                status="active"
            )

    # ------------------------------------------------
    # AUTO RESOLVE IF STUDENT IMPROVES
    # ------------------------------------------------
    elif new_level in ["medium", "low"] and active_alert:
        active_alert.status = "resolved"
        active_alert.updated_at = timezone.now()
        active_alert.save()
