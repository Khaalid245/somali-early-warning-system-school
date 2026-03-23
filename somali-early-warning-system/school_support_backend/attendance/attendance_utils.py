"""
Shared attendance day-classification utility.

UK standard (DfE):
  - All sessions absent                          = 1.0 full absent day
  - Morning sessions all absent, afternoon present = 0.5 absent day (AM half-day)
  - Morning present, afternoon sessions all absent = 0.5 absent day (PM half-day)
  - Some absent, some present (mixed periods)    = 0.5 absent day
  - All late (no absent)                         = late day (present, noted)
  - All present                                  = 1.0 present day

Returns a dict: { 'absent': float, 'present': float, 'late': int }
for a single day's set of records.
"""

MORNING_PERIODS = {'morning', '1', '2', '3'}
AFTERNOON_PERIODS = {'afternoon', '4', '5', '6'}


def classify_day(day_records):
    """
    Classify a single school day from a list/queryset of AttendanceRecord objects.

    Returns:
        dict with keys: absent (float), present (float), late (int)
    """
    if not day_records:
        return {'absent': 0, 'present': 0, 'late': 0}

    # Build period → status mapping
    period_statuses = {}
    for r in day_records:
        period_statuses[r.session.period] = r.status

    statuses = set(period_statuses.values())

    # All sessions absent (including excused as absent)
    if all(s in ('absent', 'excused') for s in statuses):
        return {'absent': 1.0, 'present': 0, 'late': 0}

    # All sessions present (or late only — no absent)
    if 'absent' not in statuses and 'excused' not in statuses:
        late = 1 if 'late' in statuses else 0
        return {'absent': 0, 'present': 1.0, 'late': late}

    # Mixed: check morning vs afternoon split (UK half-day standard)
    morning_records = {p: s for p, s in period_statuses.items() if p in MORNING_PERIODS}
    afternoon_records = {p: s for p, s in period_statuses.items() if p in AFTERNOON_PERIODS}

    morning_all_absent = bool(morning_records) and all(
        s in ('absent', 'excused') for s in morning_records.values()
    )
    afternoon_all_absent = bool(afternoon_records) and all(
        s in ('absent', 'excused') for s in afternoon_records.values()
    )

    if morning_all_absent or afternoon_all_absent:
        # UK standard: one half absent, one half present = 0.5
        return {'absent': 0.5, 'present': 0.5, 'late': 0}

    # Generic mixed (e.g. period 2 absent, period 3 present — no clear AM/PM split)
    return {'absent': 0.5, 'present': 0.5, 'late': 0}


def compute_attendance_days(student, records_qs=None):
    """
    Compute day-based attendance totals for a student.

    Args:
        student: Student instance
        records_qs: optional pre-filtered AttendanceRecord queryset.
                    If None, uses all records for the student.

    Returns:
        dict:
            total_days      - distinct school days with any record
            present_days    - float (includes 0.5 for half-days)
            absent_days     - float (includes 0.5 for half-days)
            late_days       - int
            attendance_rate - float percentage (0-100)
            consecutive_absent_days - int (most recent streak of full absent days)
    """
    from attendance.models import AttendanceRecord

    if records_qs is None:
        records_qs = AttendanceRecord.objects.filter(student=student)

    records_qs = records_qs.select_related('session')

    # Group by date
    from collections import defaultdict
    by_date = defaultdict(list)
    for r in records_qs:
        by_date[r.session.attendance_date].append(r)

    total_days = len(by_date)
    present_days = 0.0
    absent_days = 0.0
    late_days = 0

    for d, day_recs in by_date.items():
        result = classify_day(day_recs)
        absent_days += result['absent']
        present_days += result['present']
        late_days += result['late']

    attendance_rate = round((present_days / total_days * 100), 1) if total_days > 0 else 0.0

    # Consecutive full absent days (most recent streak)
    sorted_dates = sorted(by_date.keys(), reverse=True)
    consecutive_absent_days = 0
    for d in sorted_dates:
        result = classify_day(by_date[d])
        if result['absent'] == 1.0:
            consecutive_absent_days += 1
        else:
            break

    return {
        'total_days': total_days,
        'present_days': present_days,
        'absent_days': absent_days,
        'late_days': late_days,
        'attendance_rate': attendance_rate,
        'consecutive_absent_days': consecutive_absent_days,
    }
