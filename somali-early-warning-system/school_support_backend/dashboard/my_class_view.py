from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from collections import defaultdict
from datetime import date, timedelta

from students.models import StudentEnrollment
from academics.models import Classroom
from attendance.models import AttendanceRecord
from attendance.attendance_utils import compute_attendance_days, classify_day
from alerts.models import Alert
from interventions.models import InterventionCase


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_class_view(request):
    """
    Returns all students in the form master's assigned classroom(s).
    Each student includes:
      - day-based attendance totals (UK standard)
      - risk level
      - open case / alert flags
      - attendance history: last N days, one row per school day
    Query params:
      student_id  — if provided, return full history for that student only
      days        — history window in days (default 30, max 90)
    """
    user = request.user
    if user.role != 'form_master':
        return Response({'error': 'Forbidden'}, status=403)

    days_param = min(int(request.query_params.get('days', 30)), 90)
    student_id = request.query_params.get('student_id')

    classrooms = Classroom.objects.filter(form_master=user, is_active=True)
    if not classrooms.exists():
        return Response({'classrooms': [], 'students': []})

    enrollments = (
        StudentEnrollment.objects
        .filter(classroom__in=classrooms, is_active=True)
        .select_related('student', 'student__risk_profile', 'classroom')
        .order_by('classroom__name', 'student__full_name')
    )

    # If a specific student is requested, return their full history only
    if student_id:
        return _student_history(enrollments, student_id, days_param)

    # --- Roster ---
    students_out = []
    for enr in enrollments:
        student = enr.student
        totals = compute_attendance_days(student)

        risk_level = 'low'
        risk_score = 0
        if hasattr(student, 'risk_profile'):
            risk_level = student.risk_profile.risk_level
            risk_score = float(student.risk_profile.risk_score)

        has_open_case = InterventionCase.objects.filter(
            student=student,
            status__in=['open', 'in_progress', 'awaiting_parent']
        ).exists()

        has_active_alert = Alert.objects.filter(
            student=student,
            status__in=['active', 'under_review', 'escalated']
        ).exists()

        students_out.append({
            'student_id': student.student_id,
            'full_name': student.full_name,
            'admission_number': student.admission_number,
            'gender': student.gender,
            'classroom_id': enr.classroom.class_id,
            'classroom_name': enr.classroom.name,
            # Day-based attendance (UK standard)
            'total_days': totals['total_days'],
            'present_days': totals['present_days'],
            'absent_days': totals['absent_days'],
            'late_days': totals['late_days'],
            'attendance_rate': totals['attendance_rate'],
            'consecutive_absent_days': totals['consecutive_absent_days'],
            # Risk
            'risk_level': risk_level,
            'risk_score': risk_score,
            # Flags
            'has_open_case': has_open_case,
            'has_active_alert': has_active_alert,
        })

    classroom_list = [
        {'classroom_id': c.class_id, 'classroom_name': c.name}
        for c in classrooms
    ]

    return Response({
        'classrooms': classroom_list,
        'students': students_out,
    })


def _student_history(enrollments, student_id, days):
    """
    Return full day-by-day attendance history for one student.
    Each day shows: date, day_status (present/absent/half-day/late),
    absent_value (0/0.5/1.0), and per-session breakdown.
    """
    try:
        enr = enrollments.get(student__student_id=student_id)
    except StudentEnrollment.DoesNotExist:
        return Response({'error': 'Student not found in your classroom'}, status=404)

    student = enr.student
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    records = (
        AttendanceRecord.objects
        .filter(
            student=student,
            session__attendance_date__gte=start_date,
            session__attendance_date__lte=end_date,
        )
        .select_related('session', 'session__subject')
        .order_by('-session__attendance_date', 'session__period')
    )

    # Group by date
    by_date = defaultdict(list)
    for r in records:
        by_date[r.session.attendance_date].append(r)

    history = []
    for d in sorted(by_date.keys(), reverse=True):
        day_recs = by_date[d]
        result = classify_day(day_recs)

        # Human-readable day status
        if result['absent'] == 1.0:
            day_status = 'absent'
        elif result['absent'] == 0.5:
            day_status = 'half-day absent'
        elif result['late'] > 0:
            day_status = 'late'
        else:
            day_status = 'present'

        sessions = [
            {
                'period': r.session.period,
                'subject': r.session.subject.name,
                'status': r.status,
                'remarks': r.remarks or '',
            }
            for r in day_recs
        ]

        history.append({
            'date': d.strftime('%Y-%m-%d'),
            'day_of_week': d.strftime('%A'),
            'day_status': day_status,
            'absent_value': result['absent'],   # 0, 0.5, or 1.0
            'present_value': result['present'],
            'sessions': sessions,
        })

    totals = compute_attendance_days(student)

    return Response({
        'student_id': student.student_id,
        'full_name': student.full_name,
        'classroom': enr.classroom.name,
        'period_days': days,
        'totals': totals,
        'history': history,
    })
