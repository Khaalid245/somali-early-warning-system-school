"""
Attendance Service Layer - Industry Standard
Provides transparent access to current + archived data
"""
from datetime import datetime, timedelta
from django.db.models import Q, Count
from .models import (
    AttendanceRecord, AttendanceRecordArchive,
    AttendanceSession, AttendanceSessionArchive
)


class AttendanceService:
    """
    Unified service for attendance data access
    Automatically handles current + archived data
    """
    
    # Archive cutoff: 2 years
    ARCHIVE_CUTOFF_DAYS = 730
    
    @classmethod
    def get_archive_cutoff_date(cls):
        """Get the date before which data is archived"""
        return datetime.now().date() - timedelta(days=cls.ARCHIVE_CUTOFF_DAYS)
    
    @classmethod
    def get_student_attendance(cls, student_id, start_date=None, end_date=None):
        """
        Get ALL attendance records for a student (current + archived)
        
        Args:
            student_id: Student ID
            start_date: Optional start date filter
            end_date: Optional end date filter
        
        Returns:
            List of attendance records (combined from both tables)
        """
        archive_cutoff = cls.get_archive_cutoff_date()
        results = []
        
        # Determine which tables to search
        search_current = True
        search_archive = False
        
        if start_date:
            if start_date < archive_cutoff:
                search_archive = True
            if start_date >= archive_cutoff:
                search_current = True
        else:
            # No date filter = search both
            search_current = True
            search_archive = True
        
        # Search current table
        if search_current:
            query = AttendanceRecord.objects.filter(student_id=student_id)
            if start_date:
                query = query.filter(session__attendance_date__gte=start_date)
            if end_date:
                query = query.filter(session__attendance_date__lte=end_date)
            results.extend(list(query.select_related('session', 'student')))
        
        # Search archive table
        if search_archive:
            query = AttendanceRecordArchive.objects.filter(student_id=student_id)
            if start_date:
                query = query.filter(session__attendance_date__gte=start_date)
            if end_date:
                query = query.filter(session__attendance_date__lte=end_date)
            results.extend(list(query.select_related('session', 'student')))
        
        return results
    
    @classmethod
    def get_student_attendance_summary(cls, student_id):
        """
        Get attendance statistics for a student (all time)
        
        Returns:
            dict with total_sessions, present_count, absent_count, attendance_rate
        """
        all_records = cls.get_student_attendance(student_id)
        
        total = len(all_records)
        present = sum(1 for r in all_records if r.status == 'present')
        absent = sum(1 for r in all_records if r.status == 'absent')
        late = sum(1 for r in all_records if r.status == 'late')
        
        return {
            'total_sessions': total,
            'present_count': present,
            'absent_count': absent,
            'late_count': late,
            'attendance_rate': round((present / total * 100), 2) if total > 0 else 0
        }
    
    @classmethod
    def get_class_attendance(cls, classroom_id, date):
        """
        Get attendance for a class on specific date
        Automatically checks current or archive based on date
        """
        archive_cutoff = cls.get_archive_cutoff_date()
        
        if date >= archive_cutoff:
            # Search current data
            sessions = AttendanceSession.objects.filter(
                classroom_id=classroom_id,
                attendance_date=date
            ).prefetch_related('records')
        else:
            # Search archive
            sessions = AttendanceSessionArchive.objects.filter(
                classroom_id=classroom_id,
                attendance_date=date
            ).prefetch_related('records')
        
        return sessions
    
    @classmethod
    def get_attendance_count(cls, student_id=None, classroom_id=None):
        """
        Get total count of attendance records (current + archived)
        Useful for statistics
        """
        current_count = AttendanceRecord.objects.all()
        archive_count = AttendanceRecordArchive.objects.all()
        
        if student_id:
            current_count = current_count.filter(student_id=student_id)
            archive_count = archive_count.filter(student_id=student_id)
        
        if classroom_id:
            current_count = current_count.filter(session__classroom_id=classroom_id)
            archive_count = archive_count.filter(session__classroom_id=classroom_id)
        
        return current_count.count() + archive_count.count()
