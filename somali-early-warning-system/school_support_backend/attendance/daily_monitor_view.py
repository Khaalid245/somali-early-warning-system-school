from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date

from attendance.models import AttendanceSession, AttendanceRecord
from students.models import StudentEnrollment


class DailyAttendanceMonitorView(APIView):
    """Daily attendance monitoring for Form Masters — optimised: single bulk query."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_date = request.query_params.get('date', str(date.today()))

        if user.role != 'form_master':
            return Response({'error': 'Access denied'}, status=403)

        classroom = user.managed_classrooms.filter(is_active=True).first()
        if not classroom:
            return Response({'error': 'No classroom assigned'}, status=404)

        # ── Enrollments ────────────────────────────────────────────────────
        enrollments = (
            StudentEnrollment.objects
            .filter(classroom=classroom, is_active=True)
            .select_related('student')
        )
        total_students = enrollments.count()
        students = [e.student for e in enrollments]

        # ── Sessions for the day ───────────────────────────────────────────
        sessions = list(
            AttendanceSession.objects
            .filter(classroom=classroom, attendance_date=target_date)
            .select_related('subject')
        )
        total_subjects_today = len(sessions)
        session_ids = [s.session_id for s in sessions]

        if not sessions:
            return Response({
                'date': target_date,
                'classroom': classroom.name,
                'total_students': total_students,
                'total_subjects_today': 0,
                'subject_summaries': [],
                'full_day_absent_students': [],
                'student_breakdown': [],
            })

        # ── ONE bulk query for all records ─────────────────────────────────
        # Gap 3 fix: replaces N×M individual queries with a single fetch.
        all_records = list(
            AttendanceRecord.objects
            .filter(session_id__in=session_ids)
            .select_related('student')
        )

        # Build lookup: (session_id, student_id) → status
        record_map = {
            (r.session_id, r.student_id): r.status
            for r in all_records
        }

        # Build lookup: session_id → list of absent student names
        absent_by_session: dict[int, list] = {s.session_id: [] for s in sessions}
        for r in all_records:
            if r.status == 'absent':
                absent_by_session[r.session_id].append({
                    'student_id':   r.student_id,
                    'student_name': r.student.full_name,
                })

        # ── Subject summaries ──────────────────────────────────────────────
        subject_summaries = []
        for session in sessions:
            sid = session.session_id
            present = sum(1 for r in all_records if r.session_id == sid and r.status == 'present')
            absent  = sum(1 for r in all_records if r.session_id == sid and r.status == 'absent')
            late    = sum(1 for r in all_records if r.session_id == sid and r.status == 'late')
            subject_summaries.append({
                'session_id':      sid,
                'subject_id':      session.subject_id,
                'subject_name':    session.subject.name,
                'total_students':  total_students,
                'present_count':   present,
                'absent_count':    absent,
                'late_count':      late,
                'attendance_rate': round((present / total_students * 100) if total_students > 0 else 0, 1),
                'absent_students': absent_by_session[sid],
            })

        # ── Full-day absences — pure Python, no extra queries ──────────────
        full_day_absent_students = []
        for student in students:
            absent_count = sum(
                1 for sid in session_ids
                if record_map.get((sid, student.student_id)) == 'absent'
            )
            if absent_count == total_subjects_today:
                full_day_absent_students.append({
                    'student_id':      student.student_id,
                    'student_name':    student.full_name,
                    'subjects_missed': total_subjects_today,
                })

        # ── Per-student breakdown — pure Python, no extra queries ──────────
        student_breakdown = []
        for student in students:
            subject_statuses = [
                {
                    'subject_name': session.subject.name,
                    'status': record_map.get((session.session_id, student.student_id), 'not_recorded'),
                }
                for session in sessions
            ]
            # Flag if any session has not_recorded — incomplete data warning
            has_incomplete = any(s['status'] == 'not_recorded' for s in subject_statuses)
            student_breakdown.append({
                'student_id':     student.student_id,
                'student_name':   student.full_name,
                'subjects':       subject_statuses,
                'has_incomplete': has_incomplete,
            })

        return Response({
            'date':                     target_date,
            'classroom':                classroom.name,
            'total_students':           total_students,
            'total_subjects_today':     total_subjects_today,
            'subject_summaries':        subject_summaries,
            'full_day_absent_students': full_day_absent_students,
            'student_breakdown':        student_breakdown,
        })
