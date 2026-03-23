from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from collections import defaultdict
from datetime import date, timedelta

from attendance.models import AttendanceRecord
from students.models import Student, StudentEnrollment


class CrossSubjectPatternView(APIView):
    """
    Returns dates where a student was absent in 2+ subjects on the same day.
    This is the cross-subject attendance pattern analysis.

    Access: form_master (own classroom only) or admin (any student)
    URL: GET /api/attendance/cross-subject-pattern/<student_id>/
    Query params:
        days  — lookback window in days (default 60, max 180)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user

        # Permission check
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

        if user.role == 'form_master':
            # IDOR: form master can only see students in their classroom
            in_classroom = StudentEnrollment.objects.filter(
                student=student,
                classroom__form_master=user,
                is_active=True
            ).exists()
            if not in_classroom:
                return Response({'error': 'Access denied'}, status=403)
        elif user.role == 'teacher':
            # Teachers can see students in their assigned classes
            from academics.models import TeachingAssignment
            in_class = StudentEnrollment.objects.filter(
                student=student,
                classroom__teaching_assignments__teacher=user,
                classroom__teaching_assignments__is_active=True,
                is_active=True
            ).exists()
            if not in_class:
                return Response({'error': 'Access denied'}, status=403)
        elif user.role != 'admin':
            return Response({'error': 'Access denied'}, status=403)

        days = min(int(request.query_params.get('days', 60)), 180)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # Fetch all absence/late records in the window
        records = (
            AttendanceRecord.objects
            .filter(
                student=student,
                status__in=['absent', 'late'],
                session__attendance_date__gte=start_date,
                session__attendance_date__lte=end_date,
            )
            .select_related('session', 'session__subject')
            .order_by('session__attendance_date', 'session__period')
        )

        # Group by date → list of (subject, status, period)
        by_date = defaultdict(list)
        for r in records:
            by_date[r.session.attendance_date].append({
                'subject': r.session.subject.name,
                'status': r.status,
                'period': r.session.period,
            })

        # Also get all subjects recorded on each day (to know total coverage)
        all_records = (
            AttendanceRecord.objects
            .filter(
                student=student,
                session__attendance_date__gte=start_date,
                session__attendance_date__lte=end_date,
            )
            .select_related('session', 'session__subject')
        )
        subjects_per_day = defaultdict(set)
        for r in all_records:
            subjects_per_day[r.session.attendance_date].add(r.session.subject.name)

        # Build cross-subject pattern: days with 2+ absent subjects
        pattern_days = []
        for d, absent_sessions in sorted(by_date.items(), reverse=True):
            absent_subjects = [s for s in absent_sessions if s['status'] == 'absent']
            late_subjects = [s for s in absent_sessions if s['status'] == 'late']

            absent_subject_names = list({s['subject'] for s in absent_sessions})
            total_subjects_that_day = len(subjects_per_day[d])

            if len(absent_subject_names) >= 2:
                pattern_days.append({
                    'date': d.strftime('%Y-%m-%d'),
                    'day_of_week': d.strftime('%A'),
                    'absent_subjects': sorted(absent_subject_names),
                    'absent_count': len(absent_subject_names),
                    'total_subjects_recorded': total_subjects_that_day,
                    'coverage_pct': round(
                        len(absent_subject_names) / total_subjects_that_day * 100, 0
                    ) if total_subjects_that_day > 0 else 0,
                    'sessions': absent_sessions,
                })

        # Summary stats
        total_pattern_days = len(pattern_days)
        full_day_absences = sum(1 for d in pattern_days if d['coverage_pct'] == 100)
        most_missed = _most_missed_subjects(by_date)
        recurring_pairs = _find_recurring_pairs(pattern_days)

        return Response({
            'student_id': student.student_id,
            'student_name': student.full_name,
            'period_days': days,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'summary': {
                'total_pattern_days': total_pattern_days,
                'full_day_absences': full_day_absences,
                'most_missed_subjects': most_missed,
                'recurring_pairs': recurring_pairs,
            },
            'pattern_days': pattern_days,
        })


def _most_missed_subjects(by_date):
    """Count how many days each subject appears as absent."""
    counts = defaultdict(int)
    for sessions in by_date.values():
        for s in sessions:
            if s['status'] == 'absent':
                counts[s['subject']] += 1
    return sorted(
        [{'subject': k, 'absent_days': v} for k, v in counts.items()],
        key=lambda x: x['absent_days'],
        reverse=True
    )[:5]


def _find_recurring_pairs(pattern_days):
    """Find subject pairs that are absent together most often."""
    pair_counts = defaultdict(int)
    for day in pattern_days:
        subjects = sorted(day['absent_subjects'])
        for i in range(len(subjects)):
            for j in range(i + 1, len(subjects)):
                pair_counts[(subjects[i], subjects[j])] += 1

    return sorted(
        [
            {'subjects': list(pair), 'co_absent_days': count}
            for pair, count in pair_counts.items()
            if count >= 2  # Only show pairs that recur at least twice
        ],
        key=lambda x: x['co_absent_days'],
        reverse=True
    )[:5]
