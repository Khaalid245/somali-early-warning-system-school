"""
MASTERY-LEVEL Weekly Report Service
"""
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from students.models import Student
from attendance.models import AttendanceRecord
from interventions.models import InterventionCase
from .bulk_analysis_service import BulkAnalysisService


class WeeklyReportMastery:
    
    @staticmethod
    def generate_report(classroom_id=None):
        last_week_start = timezone.now() - timedelta(days=14)
        last_week_end = timezone.now() - timedelta(days=7)
        this_week_start = last_week_end
        today = timezone.now().date()
        next_week_end = today + timedelta(days=7)
        
        analysis = BulkAnalysisService.analyze_all_students(classroom_id=classroom_id)
        
        students_query = Student.objects.filter(is_active=True)
        if classroom_id:
            students_query = students_query.filter(
                enrollments__classroom_id=classroom_id,
                enrollments__is_active=True
            )
        
        last_week_absences_detail = AttendanceRecord.objects.filter(
            student__in=students_query,
            session__attendance_date__gte=last_week_start,
            session__attendance_date__lt=last_week_end,
            status='absent'
        ).values('student__full_name', 'student__admission_number').annotate(absence_count=Count('id'))
        
        this_week_absences_detail = AttendanceRecord.objects.filter(
            student__in=students_query,
            session__attendance_date__gte=last_week_end,
            status='absent'
        ).values('student__full_name', 'student__admission_number').annotate(absence_count=Count('id'))
        
        last_week_dict = {item['student__admission_number']: item['absence_count'] for item in last_week_absences_detail}
        this_week_dict = {item['student__admission_number']: item['absence_count'] for item in this_week_absences_detail}
        
        new_absences = []
        increasing_absences = []
        decreasing_absences = []
        
        for student_id, this_week_count in this_week_dict.items():
            last_week_count = last_week_dict.get(student_id, 0)
            student_name = next((item['student__full_name'] for item in this_week_absences_detail if item['student__admission_number'] == student_id), '')
            
            if last_week_count == 0:
                new_absences.append({'name': student_name, 'id': student_id, 'count': this_week_count})
            elif this_week_count > last_week_count:
                increasing_absences.append({
                    'name': student_name,
                    'id': student_id,
                    'last_week': last_week_count,
                    'this_week': this_week_count,
                    'change': this_week_count - last_week_count
                })
            elif this_week_count < last_week_count:
                decreasing_absences.append({
                    'name': student_name,
                    'id': student_id,
                    'last_week': last_week_count,
                    'this_week': this_week_count,
                    'change': last_week_count - this_week_count
                })
        
        last_week_total = sum(last_week_dict.values())
        this_week_total = sum(this_week_dict.values())
        trend = 'increasing' if this_week_total > last_week_total else 'decreasing' if this_week_total < last_week_total else 'stable'
        
        all_cases_query = InterventionCase.objects.all()
        if classroom_id:
            all_cases_query = all_cases_query.filter(
                student__enrollments__classroom_id=classroom_id,
                student__enrollments__is_active=True
            ).distinct()
        
        cases_this_week = all_cases_query.filter(created_at__gte=this_week_start)
        
        cases_by_status = {
            'open': all_cases_query.filter(status='open').count(),
            'in_progress': all_cases_query.filter(status='in_progress').count(),
            'closed': all_cases_query.filter(status='closed').count(),
            'monitoring': all_cases_query.filter(status='monitoring').count()
        }
        
        cases_changed_to_improving = all_cases_query.filter(
            updated_at__gte=this_week_start,
            progress_status__in=['improving', 'resolved']
        ).exclude(created_at__gte=this_week_start).count()
        
        closed_this_week = all_cases_query.filter(status='closed', updated_at__gte=this_week_start).count()
        students_monitoring = all_cases_query.filter(status='monitoring').values('student').distinct().count()
        overdue_followups = all_cases_query.filter(follow_up_date__lt=today, status__in=['open', 'in_progress']).count()
        escalated_cases = all_cases_query.filter(status='escalated', updated_at__gte=this_week_start).count()
        
        activity_summary = {
            'cases_created': cases_this_week.count(),
            'students_contacted': cases_this_week.values('student').distinct().count(),
            'meetings_scheduled': cases_this_week.filter(meeting_date__isnull=False).count(),
            'followups_planned': cases_this_week.filter(follow_up_date__isnull=False).count(),
            'students_improving': cases_changed_to_improving,
            'students_not_improving': all_cases_query.filter(progress_status='not_improving', updated_at__gte=this_week_start).count(),
            'cases_closed_this_week': closed_this_week,
            'students_under_monitoring': students_monitoring,
            'overdue_followups': overdue_followups,
            'cases_escalated': escalated_cases,
            'total_active_cases': all_cases_query.filter(status__in=['open', 'in_progress']).count()
        }
        
        action_log = []
        cases_with_actions = all_cases_query.filter(
            Q(created_at__gte=this_week_start) | Q(updated_at__gte=this_week_start)
        ).select_related('student', 'assigned_to', 'alert').order_by('-updated_at')[:20]
        
        for case in cases_with_actions:
            actions = []
            
            if case.created_at >= this_week_start:
                risk_level = case.alert.risk_level if case.alert else 'N/A'
                actions.append({
                    'type': 'case_created',
                    'action': 'Case opened',
                    'date': case.created_at.isoformat(),
                    'details': f"Risk level: {risk_level}"
                })
            
            if case.meeting_date and case.meeting_date >= this_week_start.date():
                actions.append({
                    'type': 'meeting_scheduled',
                    'action': 'Meeting scheduled',
                    'date': case.updated_at.isoformat(),
                    'details': f"Scheduled for: {case.meeting_date}"
                })
            
            if case.follow_up_date and case.follow_up_date >= this_week_start.date():
                actions.append({
                    'type': 'followup_planned',
                    'action': 'Follow-up planned',
                    'date': case.updated_at.isoformat(),
                    'details': f"Due: {case.follow_up_date}"
                })
            
            if case.progress_status and case.updated_at >= this_week_start and case.created_at < this_week_start:
                status_map = {
                    'no_contact': 'No contact yet',
                    'contacted': 'Student contacted',
                    'improving': 'Student showing improvement',
                    'not_improving': 'Needs additional support',
                    'resolved': 'Issue resolved'
                }
                actions.append({
                    'type': 'progress_update',
                    'action': 'Progress updated',
                    'date': case.updated_at.isoformat(),
                    'details': status_map.get(case.progress_status, case.progress_status)
                })
            
            if case.status == 'closed' and case.updated_at >= this_week_start:
                actions.append({
                    'type': 'case_closed',
                    'action': 'Case closed',
                    'date': case.updated_at.isoformat(),
                    'details': 'Successfully resolved'
                })
            
            if case.status == 'escalated' and case.updated_at >= this_week_start:
                actions.append({
                    'type': 'case_escalated',
                    'action': 'Escalated to admin',
                    'date': case.updated_at.isoformat(),
                    'details': 'Requires administrative intervention'
                })
            
            if actions:
                action_log.append({
                    'student_name': case.student.full_name,
                    'student_id': case.student.admission_number,
                    'case_id': case.case_id,
                    'actions': actions
                })
        
        upcoming_followups = all_cases_query.filter(
            follow_up_date__gte=today,
            follow_up_date__lte=next_week_end,
            status__in=['open', 'in_progress']
        ).select_related('student').order_by('follow_up_date')
        
        upcoming_meetings = all_cases_query.filter(
            meeting_date__gte=today,
            meeting_date__lte=next_week_end,
            status__in=['open', 'in_progress']
        ).select_related('student').order_by('meeting_date')
        
        needs_escalation = all_cases_query.filter(
            status='in_progress',
            progress_status='not_improving',
            created_at__lt=timezone.now() - timedelta(days=21)
        ).select_related('student')
        
        next_week_priorities = {
            'followups': [{
                'student_name': case.student.full_name,
                'student_id': case.student.admission_number,
                'case_id': case.case_id,
                'due_date': case.follow_up_date.isoformat()
            } for case in upcoming_followups],
            'meetings': [{
                'student_name': case.student.full_name,
                'student_id': case.student.admission_number,
                'case_id': case.case_id,
                'meeting_date': case.meeting_date.isoformat()
            } for case in upcoming_meetings],
            'escalation_needed': [{
                'student_name': case.student.full_name,
                'student_id': case.student.admission_number,
                'case_id': case.case_id,
                'days_open': (timezone.now().date() - case.created_at.date()).days
            } for case in needs_escalation]
        }
        
        return {
            'week_ending': timezone.now().date().isoformat(),
            'statistics': analysis['statistics'],
            'cases_by_status': cases_by_status,
            'trend': {
                'direction': trend,
                'last_week_absences': last_week_total,
                'this_week_absences': this_week_total,
                'change': this_week_total - last_week_total,
                'last_week_students': len(last_week_dict),
                'this_week_students': len(this_week_dict),
                'new_absences': new_absences[:5],
                'increasing_absences': sorted(increasing_absences, key=lambda x: x['change'], reverse=True)[:5],
                'decreasing_absences': sorted(decreasing_absences, key=lambda x: x['change'], reverse=True)[:5]
            },
            'activity_summary': activity_summary,
            'action_log': action_log,
            'next_week_priorities': next_week_priorities,
            'top_priority_students': BulkAnalysisService.generate_priority_list(analysis, limit=10),
            'recommendations': BulkAnalysisService._generate_system_recommendations(analysis)
        }
