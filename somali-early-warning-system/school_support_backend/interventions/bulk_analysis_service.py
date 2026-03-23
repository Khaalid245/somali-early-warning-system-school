"""
Bulk Analysis Service - Analyzes unlimited students and generates comprehensive reports
"""
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from students.models import Student, Classroom
from attendance.models import AttendanceRecord
from .ai_recommendations import calculate_student_risk_score, generate_recommendations


class BulkAnalysisService:
    """Service for analyzing large numbers of students efficiently"""
    
    @staticmethod
    def analyze_all_students(classroom_id=None, academic_year=None):
        """
        Analyze all students or filter by classroom/academic year
        Returns: dict with risk groups, statistics, and recommendations
        """
        # Query students efficiently
        students_query = Student.objects.filter(is_active=True).prefetch_related('attendance_records')
        
        if classroom_id:
            students_query = students_query.filter(
                enrollments__classroom_id=classroom_id,
                enrollments__is_active=True
            )
        
        if academic_year:
            students_query = students_query.filter(
                enrollments__academic_year=academic_year,
                enrollments__is_active=True
            )
        
        students = students_query.distinct()
        
        # Analyze each student
        risk_groups = {
            'critical': [],  # 75-100
            'high': [],      # 50-74
            'moderate': [],  # 25-49
            'low': []        # 0-24
        }
        
        total_analyzed = 0
        
        for student in students:
            risk_data = calculate_student_risk_score(student)
            risk_score = risk_data['risk_score']  # Extract score from dict
            
            # Get current classroom
            current_enrollment = student.enrollments.filter(is_active=True).first()
            classroom_name = current_enrollment.classroom.name if current_enrollment else 'N/A'
            
            student_data = {
                'id': student.student_id,
                'name': student.full_name,
                'student_id': student.admission_number,
                'classroom': classroom_name,
                'risk_score': risk_score,
                'attendance_rate': risk_data.get('attendance_rate', 0),
                'total_absences': risk_data.get('absent_count', 0),
                'recent_absences': risk_data.get('recent_absences', 0)
            }
            
            # Categorize by risk level
            if risk_score >= 75:
                risk_groups['critical'].append(student_data)
            elif risk_score >= 50:
                risk_groups['high'].append(student_data)
            elif risk_score >= 25:
                risk_groups['moderate'].append(student_data)
            else:
                risk_groups['low'].append(student_data)
            
            total_analyzed += 1
        
        # Sort each group by risk score (highest first)
        for group in risk_groups.values():
            group.sort(key=lambda x: x['risk_score'], reverse=True)
        
        # Generate statistics
        statistics = {
            'total_students': total_analyzed,
            'critical_count': len(risk_groups['critical']),
            'high_count': len(risk_groups['high']),
            'moderate_count': len(risk_groups['moderate']),
            'low_count': len(risk_groups['low']),
            'critical_percentage': round((len(risk_groups['critical']) / total_analyzed * 100), 1) if total_analyzed > 0 else 0,
            'high_percentage': round((len(risk_groups['high']) / total_analyzed * 100), 1) if total_analyzed > 0 else 0,
            'moderate_percentage': round((len(risk_groups['moderate']) / total_analyzed * 100), 1) if total_analyzed > 0 else 0,
            'low_percentage': round((len(risk_groups['low']) / total_analyzed * 100), 1) if total_analyzed > 0 else 0,
            'average_risk_score': round(sum([s['risk_score'] for group in risk_groups.values() for s in group]) / total_analyzed, 1) if total_analyzed > 0 else 0
        }
        
        return {
            'risk_groups': risk_groups,
            'statistics': statistics,
            'analyzed_at': timezone.now().isoformat(),
            'filters': {
                'classroom_id': classroom_id,
                'academic_year': academic_year
            }
        }
    
    @staticmethod
    def generate_priority_list(analysis_result, limit=50):
        """
        Generate prioritized intervention list
        Returns: Top N students requiring immediate attention
        """
        priority_list = []
        
        # Critical students first
        priority_list.extend(analysis_result['risk_groups']['critical'])
        
        # Then high-risk students
        priority_list.extend(analysis_result['risk_groups']['high'])
        
        # Limit to top N
        priority_list = priority_list[:limit]
        
        # Add recommendations for each
        for student_data in priority_list:
            student = Student.objects.get(student_id=student_data['id'])
            risk_data = calculate_student_risk_score(student)
            recommendations = generate_recommendations(student, risk_data)
            student_data['recommendations'] = recommendations[:3]  # Top 3 recommendations
        
        return priority_list
    
    @staticmethod
    def generate_weekly_report(classroom_id=None):
        """Generate comprehensive weekly report with action log"""
        from interventions.models import InterventionCase
        
        analysis = BulkAnalysisService.analyze_all_students(classroom_id=classroom_id)
        
        last_week_start = timezone.now() - timedelta(days=14)
        last_week_end = timezone.now() - timedelta(days=7)
        this_week_start = last_week_end
        today = timezone.now().date()
        
        students_query = Student.objects.filter(is_active=True)
        if classroom_id:
            students_query = students_query.filter(
                enrollments__classroom_id=classroom_id,
                enrollments__is_active=True
            )
        
        last_week_absences = AttendanceRecord.objects.filter(
            student__in=students_query,
            session__attendance_date__gte=last_week_start,
            session__attendance_date__lt=last_week_end,
            status='absent'
        ).count()
        
        this_week_absences = AttendanceRecord.objects.filter(
            student__in=students_query,
            session__attendance_date__gte=last_week_end,
            status='absent'
        ).count()
        
        trend = 'increasing' if this_week_absences > last_week_absences else 'decreasing' if this_week_absences < last_week_absences else 'stable'
        
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
        
        closed_this_week = all_cases_query.filter(status='closed', updated_at__gte=this_week_start).count()
        students_monitoring = all_cases_query.filter(status='monitoring').values('student').distinct().count()
        overdue_followups = all_cases_query.filter(follow_up_date__lt=today, status__in=['open', 'in_progress']).count()
        escalated_cases = all_cases_query.filter(status='escalated', updated_at__gte=this_week_start).count()
        
        activity_summary = {
            'cases_created': cases_this_week.count(),
            'students_contacted': cases_this_week.values('student').distinct().count(),
            'meetings_scheduled': cases_this_week.filter(meeting_date__isnull=False).count(),
            'followups_planned': cases_this_week.filter(follow_up_date__isnull=False).count(),
            'students_improving': cases_this_week.filter(progress_status__in=['improving', 'resolved']).count(),
            'students_not_improving': cases_this_week.filter(progress_status='not_improving').count(),
            'cases_closed_this_week': closed_this_week,
            'students_under_monitoring': students_monitoring,
            'overdue_followups': overdue_followups,
            'cases_escalated': escalated_cases,
            'total_active_cases': all_cases_query.filter(status__in=['open', 'in_progress']).count()
        }
        
        # Action log with real student data
        action_log = []
        cases_with_actions = all_cases_query.filter(
            Q(created_at__gte=this_week_start) | Q(updated_at__gte=this_week_start)
        ).select_related('student', 'assigned_to', 'alert').order_by('-updated_at')[:20]
        
        for case in cases_with_actions:
            actions = []
            
            if case.created_at >= this_week_start:
                actions.append({
                    'type': 'case_created',
                    'action': 'Case opened',
                    'date': case.created_at.isoformat(),
                    'details': f"Risk level: {case.alert.risk_level if case.alert else 'N/A'}"
                })
            
            if case.meeting_date and case.updated_at >= this_week_start:
                actions.append({
                    'type': 'meeting_scheduled',
                    'action': 'Meeting scheduled',
                    'date': case.updated_at.isoformat(),
                    'details': f"Scheduled for: {case.meeting_date}"
                })
            
            if case.follow_up_date and case.updated_at >= this_week_start:
                actions.append({
                    'type': 'followup_planned',
                    'action': 'Follow-up planned',
                    'date': case.updated_at.isoformat(),
                    'details': f"Due: {case.follow_up_date}"
                })
            
            if case.progress_status and case.updated_at >= this_week_start:
                status_map = {
                    'no_contact': 'No contact yet',
                    'contacted': 'Student contacted',
                    'improving': 'Student improving',
                    'not_improving': 'Needs more support',
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
        
        return {
            'week_ending': timezone.now().date().isoformat(),
            'statistics': analysis['statistics'],
            'cases_by_status': cases_by_status,
            'trend': {
                'direction': trend,
                'last_week_absences': last_week_absences,
                'this_week_absences': this_week_absences,
                'change': this_week_absences - last_week_absences
            },
            'activity_summary': activity_summary,
            'action_log': action_log,
            'top_priority_students': BulkAnalysisService.generate_priority_list(analysis, limit=10),
            'recommendations': BulkAnalysisService._generate_system_recommendations(analysis)
        }
    
    @staticmethod
    def _generate_system_recommendations(analysis):
        """Generate system-level recommendations based on analysis"""
        stats = analysis['statistics']
        recommendations = []
        
        if stats['critical_percentage'] > 10:
            recommendations.append({
                'priority': 'URGENT',
                'message': f"{stats['critical_percentage']}% of students are at critical risk. Immediate intervention required.",
                'action': 'Schedule emergency meetings with all critical-risk students and parents'
            })
        
        if stats['high_percentage'] + stats['critical_percentage'] > 25:
            recommendations.append({
                'priority': 'HIGH',
                'message': f"{stats['high_percentage'] + stats['critical_percentage']}% of students need intervention support.",
                'action': 'Allocate additional counseling resources and create intervention plans'
            })
        
        if stats['average_risk_score'] > 40:
            recommendations.append({
                'priority': 'MEDIUM',
                'message': f"Average risk score is {stats['average_risk_score']}, indicating systemic issues.",
                'action': 'Review school-wide attendance policies and engagement strategies'
            })
        
        if not recommendations:
            recommendations.append({
                'priority': 'LOW',
                'message': 'Overall student attendance is healthy. Continue monitoring.',
                'action': 'Maintain current support systems and celebrate successes'
            })
        
        return recommendations
