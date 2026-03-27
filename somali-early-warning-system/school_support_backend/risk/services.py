from decimal import Decimal
from django.utils import timezone

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
    from attendance.attendance_utils import compute_attendance_days

    records = AttendanceRecord.objects.filter(
        student=student,
        session__subject=subject
    )

    # Session-level counts (kept for raw reference)
    total_sessions = records.count()
    absence_count = records.filter(status="absent").count()
    late_count = records.filter(status="late").count()

    absence_rate = Decimal("0.00")
    if total_sessions > 0:
        absence_rate = (
            Decimal(absence_count) / Decimal(total_sessions)
        ) * Decimal("100")

    # Day-based counts (UK standard)
    day_totals = compute_attendance_days(student, records_qs=records)
    total_days = day_totals['total_days']
    absent_days = Decimal(str(day_totals['absent_days']))
    late_days = day_totals['late_days']
    day_absence_rate = Decimal(str(
        round(day_totals['absent_days'] / total_days * 100, 2)
        if total_days > 0 else 0
    ))

    insight, _ = SubjectRiskInsight.objects.get_or_create(
        student=student,
        subject=subject
    )

    # Session fields
    insight.total_sessions = total_sessions
    insight.absence_count = absence_count
    insight.late_count = late_count
    insight.absence_rate = absence_rate.quantize(Decimal("0.01"))
    # Day-based fields
    insight.total_days = total_days
    insight.absent_days = absent_days
    insight.late_days = late_days
    insight.day_absence_rate = day_absence_rate.quantize(Decimal("0.01"))
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
    """Count consecutive full absent days (UK standard: half-days do NOT break streak but don't count)."""
    from attendance.attendance_utils import compute_attendance_days
    totals = compute_attendance_days(student)
    return totals['consecutive_absent_days']


# =====================================================
# OVERALL RISK ENGINE
# =====================================================
def _update_overall_student_risk(student, subject_streak, full_day_streak):

    from attendance.attendance_utils import compute_attendance_days

    # Day-based attendance rate (UK standard) — replaces session-based avg_absence_rate
    totals = compute_attendance_days(student)
    attendance_rate = Decimal(str(totals['attendance_rate']))  # 0-100
    absent_days = totals['absent_days']

    profile, _ = StudentRiskProfile.objects.get_or_create(
        student=student
    )

    # Base score from attendance rate
    # Standard: <75% = critical, <80% = high risk, <90% = persistent absentee
    risk_score = Decimal("0")
    if attendance_rate < Decimal("75"):
        risk_score += Decimal("40")   # Critical threshold
    elif attendance_rate < Decimal("80"):
        risk_score += Decimal("30")   # High risk threshold
    elif attendance_rate < Decimal("90"):
        risk_score += Decimal("15")   # Persistent absentee threshold

    # Total absent days in term
    # Standard: 10 days = intervention threshold
    if absent_days >= 15:
        risk_score += Decimal("10")
    elif absent_days >= 10:
        risk_score += Decimal("7")    # Intervention threshold
    elif absent_days >= 3:
        risk_score += Decimal("3")    # First alert threshold (was 5 sessions)

    # Consecutive FULL DAY absences
    # Standard: 3 consecutive days = first alert, 5 = high, 10 = critical
    if full_day_streak >= 10:
        risk_score += Decimal("40")
    elif full_day_streak >= 5:
        risk_score += Decimal("30")
    elif full_day_streak >= 3:
        risk_score += Decimal("20")   # First alert: 3 consecutive days
    elif full_day_streak >= 1:
        risk_score += Decimal("5")

    # Consecutive subject absences (same subject missed repeatedly)
    if subject_streak >= 7:
        risk_score += Decimal("15")
    elif subject_streak >= 5:
        risk_score += Decimal("10")
    elif subject_streak >= 3:
        risk_score += Decimal("5")

    risk_score = min(risk_score, Decimal("100")).quantize(Decimal("0.01"))

    old_level = profile.risk_level

    # Standard thresholds (matches the table):
    # attendance <75% = critical, <80% = high, <90% = medium (persistent absentee)
    if risk_score >= Decimal("75"):
        new_level = "critical"
    elif risk_score >= Decimal("50"):
        new_level = "high"
    elif risk_score >= Decimal("25"):
        new_level = "medium"
    else:
        new_level = "low"

    profile.risk_score = risk_score
    profile.risk_level = new_level
    profile.last_calculated = timezone.now()
    profile.save()

    # ── Update persistent_absentee flag on Student (UK DfE: <90% = persistent absentee) ──
    is_persistent = attendance_rate < Decimal("90")
    if student.persistent_absentee != is_persistent:
        type(student).objects.filter(pk=student.pk).update(
            persistent_absentee=is_persistent
        )

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
    # MEDIUM, HIGH OR CRITICAL → ALERT
    # HIGH OR CRITICAL → ALERT + INTERVENTION
    # Standard: first alert at 3 consecutive days (medium), intervention at 10 days (high)
    # ------------------------------------------------
    if new_level in ["medium", "high", "critical"]:

        if not active_alert:
            active_alert = Alert.objects.create(
                student=student,
                alert_type="attendance",
                risk_level=new_level,
                status="active",
                assigned_to=form_master,
                subject=None
            )
        else:
            if active_alert.risk_level != new_level:
                active_alert.risk_level = new_level
                active_alert.save()

        # Intervention only for high/critical (10+ absent days threshold)
        if new_level in ["high", "critical"]:
            existing_case = InterventionCase.objects.filter(
                student=student,
                alert=active_alert,
                status__in=["open", "in_progress", "awaiting_parent"]
            ).first()

            if not existing_case:
                try:
                    InterventionCase.objects.create(
                        student=student,
                        alert=active_alert,
                        assigned_to=form_master,
                        status="open"
                    )
                except Exception:
                    pass  # duplicate case guard in model — safe to ignore

    # ------------------------------------------------
    # AUTO RESOLVE
    # ------------------------------------------------
    elif new_level in ["medium", "low"] and active_alert:
        active_alert.status = "resolved"
        active_alert.save()

        # Close open intervention cases and update chronic tracking for each
        auto_closing = InterventionCase.objects.filter(
            student=student,
            alert=active_alert,
            status__in=["open", "in_progress", "awaiting_parent"]
        )
        from attendance.attendance_utils import compute_attendance_days
        try:
            rate_at_close = round(compute_attendance_days(student)['attendance_rate'], 2)
        except Exception:
            rate_at_close = None
        for case in auto_closing:
            InterventionCase.objects.filter(pk=case.pk).update(
                status="closed",
                attendance_rate_at_close=rate_at_close,
            )
            student.refresh_from_db(fields=['intervention_count', 'chronic_absentee'])
            new_count = student.intervention_count + 1
            is_chronic = new_count >= 3
            type(student).objects.filter(pk=student.pk).update(
                intervention_count=new_count,
                chronic_absentee=is_chronic,
            )
            student.intervention_count = new_count  # keep in-memory value current
