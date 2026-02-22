from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q
from datetime import date, timedelta

from attendance.models import AttendanceRecord, AttendanceSession
from students.models import Student, StudentEnrollment


class StudentAttendanceReportView(APIView):
    """Public attendance report for families"""
    permission_classes = [AllowAny]
    
    def get(self, request, student_id):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        
        # Get enrollment
        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_active=True
        ).select_related('student', 'classroom').first()
        
        classroom_name = enrollment.classroom.name if enrollment else 'Not Enrolled'
        
        # Period: Last 90 days
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        
        # Get all attendance records
        records = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date__gte=start_date,
            session__attendance_date__lte=end_date
        ).select_related('session__subject')
        
        total_records = records.count()
        present_count = records.filter(status='present').count()
        absent_count = records.filter(status='absent').count()
        late_count = records.filter(status='late').count()
        
        attendance_rate = round((present_count / total_records * 100) if total_records > 0 else 0, 1)
        
        # Subject breakdown
        from django.db.models import Count, Case, When
        subject_stats = records.values('session__subject__name').annotate(
            present=Count('record_id', filter=Q(status='present')),
            absent=Count('record_id', filter=Q(status='absent')),
            late=Count('record_id', filter=Q(status='late')),
            total=Count('record_id')
        )
        
        subject_breakdown = []
        for subj in subject_stats:
            total = subj['total']
            rate = round((subj['present'] / total * 100) if total > 0 else 0, 1)
            subject_breakdown.append({
                'subject_name': subj['session__subject__name'],
                'present': subj['present'],
                'absent': subj['absent'],
                'late': subj['late'],
                'rate': rate
            })
        
        # Recent history (last 30 days)
        recent_date = end_date - timedelta(days=30)
        recent_records = records.filter(
            session__attendance_date__gte=recent_date
        ).order_by('-session__attendance_date')[:20]
        
        recent_history = [{
            'date': r.session.attendance_date.strftime('%Y-%m-%d'),
            'subject': r.session.subject.name,
            'status': r.status
        } for r in recent_records]
        
        # Calculate total school days
        total_days = AttendanceSession.objects.filter(
            attendance_date__gte=start_date,
            attendance_date__lte=end_date
        ).values('attendance_date').distinct().count()
        
        return Response({
            'student_id': student.student_id,
            'student_name': student.full_name,
            'classroom': classroom_name,
            'period_start': start_date.strftime('%Y-%m-%d'),
            'period_end': end_date.strftime('%Y-%m-%d'),
            'total_days': total_days,
            'present_count': present_count,
            'absent_count': absent_count,
            'late_count': late_count,
            'attendance_rate': attendance_rate,
            'subject_breakdown': subject_breakdown,
            'recent_history': recent_history
        })
