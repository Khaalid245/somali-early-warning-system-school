from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from datetime import datetime, timedelta
from academics.models import TeachingAssignment, Classroom
from students.models import Student, StudentEnrollment
from attendance.models import AttendanceRecord, AttendanceSession


class StudentAttendanceTrackingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role != 'teacher':
            return Response({'error': 'Only teachers can access this'}, status=403)
        
        # Get teacher's classes
        my_classes = TeachingAssignment.objects.filter(
            teacher=user, is_active=True
        ).select_related('classroom', 'subject').values(
            'classroom__class_id', 'classroom__name', 'subject__name'
        ).distinct()
        
        classes_data = []
        for cls in my_classes:
            total_sessions = AttendanceSession.objects.filter(
                classroom_id=cls['classroom__class_id']
            ).count()
            
            classes_data.append({
                'class_id': cls['classroom__class_id'],
                'class_name': cls['classroom__name'],
                'subject': cls['subject__name'],
                'total_sessions': total_sessions
            })
        
        return Response({'classes': classes_data})


class ClassStudentsAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        user = request.user
        
        if user.role != 'teacher':
            return Response({'error': 'Only teachers can access this'}, status=403)
        
        # Verify teacher has access to this class
        has_access = TeachingAssignment.objects.filter(
            teacher=user, classroom_id=class_id, is_active=True
        ).exists()
        
        if not has_access:
            return Response({'error': 'Access denied'}, status=403)
        
        # Get students in this class
        enrollments = StudentEnrollment.objects.filter(
            classroom_id=class_id, is_active=True
        ).select_related('student')
        
        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            
            # Get attendance stats
            records = AttendanceRecord.objects.filter(
                student=student,
                session__classroom_id=class_id
            )
            
            total_sessions = records.count()
            present_count = records.filter(status='present').count()
            excused_count = records.filter(status='excused').count()
            absent_count = records.filter(status='absent').count()
            late_count = records.filter(status='late').count()
            
            # Excused students count as present for attendance percentage
            attendance_percentage = round(((present_count + excused_count) / total_sessions * 100), 1) if total_sessions > 0 else 0
            grade = self._calculate_grade(attendance_percentage)
            
            students_data.append({
                'student_id': student.student_id,
                'student_name': student.full_name,
                'admission_number': student.admission_number,
                'total_sessions': total_sessions,
                'present_count': present_count,
                'absent_count': absent_count,
                'late_count': late_count,
                'excused_count': excused_count,
                'attendance_percentage': attendance_percentage,
                'grade': grade
            })
        
        return Response({'students': students_data})
    
    def _calculate_grade(self, percentage):
        if percentage >= 95:
            return 'A'
        elif percentage >= 85:
            return 'B'
        elif percentage >= 75:
            return 'C'
        elif percentage >= 65:
            return 'D'
        else:
            return 'F'


class StudentAttendanceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        
        if user.role != 'teacher':
            return Response({'error': 'Only teachers can access this'}, status=403)
        
        # Get filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')
        
        # Get student
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        
        # Get attendance records
        records = AttendanceRecord.objects.filter(
            student=student
        ).select_related('session', 'session__subject', 'session__classroom').order_by('-session__attendance_date')
        
        # Apply filters
        if start_date:
            records = records.filter(session__attendance_date__gte=start_date)
        if end_date:
            records = records.filter(session__attendance_date__lte=end_date)
        if status_filter:
            records = records.filter(status=status_filter)
        
        # Build history
        history = []
        for record in records:
            history.append({
                'date': record.session.attendance_date,
                'time': record.session.created_at.strftime('%H:%M') if record.session.created_at else 'N/A',
                'subject': record.session.subject.name,
                'classroom': record.session.classroom.name,
                'status': record.status,
                'remarks': record.remarks or ''
            })
        
        # Calculate stats
        total = records.count()
        present = records.filter(status='present').count()
        excused = records.filter(status='excused').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        # Excused counts as present
        percentage = round(((present + excused) / total * 100), 1) if total > 0 else 0
        
        # Monthly summary
        monthly_summary = self._get_monthly_summary(student)
        
        return Response({
            'student': {
                'student_id': student.student_id,
                'name': student.full_name,
                'admission_number': student.admission_number
            },
            'stats': {
                'total_sessions': total,
                'present_count': present,
                'excused_count': excused,
                'absent_count': absent,
                'late_count': late,
                'attendance_percentage': percentage,
                'grade': self._calculate_grade(percentage)
            },
            'history': history,
            'monthly_summary': monthly_summary
        })
    
    def _calculate_grade(self, percentage):
        if percentage >= 95:
            return 'A'
        elif percentage >= 85:
            return 'B'
        elif percentage >= 75:
            return 'C'
        elif percentage >= 65:
            return 'D'
        else:
            return 'F'
    
    def _get_monthly_summary(self, student):
        from django.db.models.functions import TruncMonth
        
        six_months_ago = datetime.now() - timedelta(days=180)
        
        monthly = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('session__attendance_date')
        ).values('month').annotate(
            total=Count('record_id'),
            present=Count('record_id', filter=Q(status='present')),
            excused=Count('record_id', filter=Q(status='excused')),
            absent=Count('record_id', filter=Q(status='absent'))
        ).order_by('month')
        
        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'total': item['total'],
                'present': item['present'],
                'excused': item['excused'],
                'absent': item['absent'],
                'percentage': round(((item['present'] + item['excused']) / item['total'] * 100), 1) if item['total'] > 0 else 0
            }
            for item in monthly
        ]
