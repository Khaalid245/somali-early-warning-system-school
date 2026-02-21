from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from datetime import date

from attendance.models import AttendanceSession, AttendanceRecord
from students.models import Student, StudentEnrollment


class DailyAttendanceMonitorView(APIView):
    """Production-ready daily attendance monitoring for Form Masters"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        target_date = request.query_params.get('date', str(date.today()))
        
        if user.role != 'form_master':
            return Response({'error': 'Access denied'}, status=403)
        
        # Get Form Master's classroom
        classroom = user.managed_classrooms.filter(is_active=True).first()
        if not classroom:
            return Response({'error': 'No classroom assigned'}, status=404)
        
        # Get all students in classroom
        enrollments = StudentEnrollment.objects.filter(
            classroom=classroom,
            is_active=True
        ).select_related('student')
        
        total_students = enrollments.count()
        student_ids = [e.student_id for e in enrollments]
        
        # Get today's sessions
        sessions = AttendanceSession.objects.filter(
            classroom=classroom,
            attendance_date=target_date
        ).select_related('subject').prefetch_related('records')
        
        # Subject-wise summary
        subject_summaries = []
        for session in sessions:
            records = session.records.all()
            present = records.filter(status='present').count()
            absent = records.filter(status='absent').count()
            late = records.filter(status='late').count()
            
            subject_summaries.append({
                'session_id': session.session_id,
                'subject_id': session.subject_id,
                'subject_name': session.subject.name,
                'total_students': total_students,
                'present_count': present,
                'absent_count': absent,
                'late_count': late,
                'attendance_rate': round((present / total_students * 100) if total_students > 0 else 0, 1),
                'absent_students': [
                    {
                        'student_id': r.student_id,
                        'student_name': r.student.full_name
                    } for r in records.filter(status='absent')
                ]
            })
        
        # Detect full-day absences
        total_subjects_today = sessions.count()
        full_day_absent_students = []
        
        if total_subjects_today > 0:
            for enrollment in enrollments:
                student = enrollment.student
                # Count how many subjects student was absent
                absent_count = AttendanceRecord.objects.filter(
                    session__in=sessions,
                    student=student,
                    status='absent'
                ).count()
                
                # If absent from ALL subjects = full day absent
                if absent_count == total_subjects_today:
                    full_day_absent_students.append({
                        'student_id': student.student_id,
                        'student_name': student.full_name,
                        'subjects_missed': total_subjects_today
                    })
        
        # Per-student breakdown
        student_breakdown = []
        for enrollment in enrollments:
            student = enrollment.student
            student_records = AttendanceRecord.objects.filter(
                session__in=sessions,
                student=student
            ).select_related('session__subject')
            
            subject_statuses = []
            for session in sessions:
                record = student_records.filter(session=session).first()
                subject_statuses.append({
                    'subject_name': session.subject.name,
                    'status': record.status if record else 'not_recorded'
                })
            
            student_breakdown.append({
                'student_id': student.student_id,
                'student_name': student.full_name,
                'subjects': subject_statuses
            })
        
        return Response({
            'date': target_date,
            'classroom': classroom.name,
            'total_students': total_students,
            'total_subjects_today': total_subjects_today,
            'subject_summaries': subject_summaries,
            'full_day_absent_students': full_day_absent_students,
            'student_breakdown': student_breakdown
        })
