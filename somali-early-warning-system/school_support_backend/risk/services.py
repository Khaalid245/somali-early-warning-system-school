from decimal import Decimal
from django.utils import timezone
from django.db.models import Count

from attendance.models import AttendanceRecord
from .models import StudentRiskProfile, SubjectRiskInsight
from alerts.models import Alert


# =====================================================
# MAIN ENTRY POINT
# =====================================================
def update_risk_after_session(session):
    """
    Called automatically after attendance session is completed.
    Updates:
    - Subject analytics
    - Consecutive absence detection
    - Overall risk profile
    - Alert escalation
    """

    for record in session.records.select_related("student"):
        student = record.student
        subject = session.subject

        # 1️⃣ Update subject analytics
        _update_subject_insight(student, subject)

        # 2️⃣ Calculate streaks
        subject_streak = _calculate_subject_streak(student, subject)
        full_day_streak = _calculate_full_day_streak(student)

        # 3️⃣ Update overall risk
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
        ) * 100

    insight, _ = SubjectRiskInsight.objects.get_or_create(
        student=student,
        subject=subject
    )

    insight.total_sessions = total_sessions
    insight.absence_count = absence_count
    insight.late_count = late_count
    insight.absence_rate = round(absence_rate, 2)
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
# FULL-DAY CONSECUTIVE STREAK
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

        # If ALL subjects that day are absent
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
        avg_absence_rate = sum(
            insight.absence_rate for insight in insights
        ) / insights.count()

    profile, _ = StudentRiskProfile.objects.get_or_create(
        student=student
    )

    # -------------------------------------------------
    # BASE RISK FROM ABSENCE RATE
    # -------------------------------------------------
    risk_score = avg_absence_rate

    # -------------------------------------------------
    # SUBJECT STREAK WEIGHT
    # -------------------------------------------------
    if subject_streak >= 7:
        risk_score += 40
    elif subject_streak >= 5:
        risk_score += 25
    elif subject_streak >= 3:
        risk_score += 15

    # -------------------------------------------------
    # FULL DAY STREAK WEIGHT (STRONGER)
    # -------------------------------------------------
    if full_day_streak >= 5:
        risk_score += 40
    elif full_day_streak >= 3:
        risk_score += 25

    profile.risk_score = round(risk_score, 2)

    # -------------------------------------------------
    # RISK LEVEL MAPPING
    # -------------------------------------------------
    old_level = profile.risk_level

    if profile.risk_score >= 75:
        new_level = "critical"
    elif profile.risk_score >= 55:
        new_level = "high"
    elif profile.risk_score >= 30:
        new_level = "medium"
    else:
        new_level = "low"

    profile.risk_level = new_level
    profile.last_calculated = timezone.now()
    profile.save()

    # -------------------------------------------------
    # AUTOMATIC ALERT MANAGEMENT
    # -------------------------------------------------
    _handle_alerts(student, old_level, new_level)


# =====================================================
# ALERT MANAGEMENT (ESCALATION SYSTEM)
# =====================================================
def _handle_alerts(student, old_level, new_level):

    active_alert = Alert.objects.filter(
        student=student,
        status="active"
    ).first()

    # Escalate or create alert
    if new_level in ["high", "critical"]:

        if active_alert:
            active_alert.risk_level = new_level
            active_alert.save()
        else:
            Alert.objects.create(
                student=student,
                alert_type="Attendance Risk",
                risk_level=new_level,
                status="active"
            )

    # Auto resolve if student improves
    elif new_level == "low" and active_alert:
        active_alert.status = "resolved"
        active_alert.save()
