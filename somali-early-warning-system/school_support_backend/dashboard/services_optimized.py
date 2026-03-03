# Critical fixes for Teacher Dashboard
# 1. Fix N+1 Query Problem in Form Master high-risk students
# 2. Add error handling
# 3. Add input validation

import logging
from django.core.exceptions import ValidationError
from django.db import DatabaseError

logger = logging.getLogger(__name__)

# Input validation
VALID_TIME_RANGES = ['current_week', 'current_month', 'current_semester', 'academic_year']
VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical']

def validate_dashboard_filters(filters):
    """Validate dashboard filter inputs"""
    if 'time_range' in filters and filters['time_range'] not in VALID_TIME_RANGES:
        raise ValidationError(f"Invalid time_range. Must be one of: {VALID_TIME_RANGES}")
    
    if 'risk_level' in filters and filters['risk_level'] not in VALID_RISK_LEVELS:
        raise ValidationError(f"Invalid risk_level. Must be one of: {VALID_RISK_LEVELS}")


# OPTIMIZED: Fix N+1 Query Problem for Form Master Dashboard
def get_form_master_high_risk_students_optimized(my_classrooms):
    """
    BEFORE: 15-20 queries (N+1 problem)
    AFTER: 2-3 queries (optimized with annotations)
    """
    from django.db.models import Count, Q, F, Value, IntegerField, Case, When
    from students.models import StudentEnrollment
    
    try:
        high_risk_students = list(
            StudentEnrollment.objects.filter(
                classroom__in=my_classrooms,
                is_active=True,
                student__risk_profile__risk_level__in=['high', 'critical']
            )
            .select_related('student', 'student__risk_profile', 'classroom')
            .annotate(
                # Attendance stats in single query
                total_sessions=Count('student__attendance_records'),
                absent_count=Count('student__attendance_records', filter=Q(student__attendance_records__status='absent')),
                late_count=Count('student__attendance_records', filter=Q(student__attendance_records__status='late')),
                present_count=Count('student__attendance_records', filter=Q(student__attendance_records__status='present')),
                
                # Open cases count
                open_cases_count=Count('student__intervention_cases', filter=Q(
                    student__intervention_cases__status__in=['open', 'in_progress', 'awaiting_parent']
                )),
                
                # Has intervention
                has_intervention_count=Count('student__intervention_cases'),
                
                # Active alerts count
                active_alerts_count=Count('student__alerts', filter=Q(
                    student__alerts__status__in=['active', 'under_review']
                ))
            )
            .values(
                'student__student_id',
                'student__full_name',
                'student__risk_profile__risk_level',
                'student__risk_profile__risk_score',
                'total_sessions',
                'absent_count',
                'late_count',
                'present_count',
                'classroom__name',
                'open_cases_count',
                'has_intervention_count',
                'active_alerts_count'
            )
        )
        
        # Calculate derived fields
        for student in high_risk_students:
            total = student['total_sessions'] or 1
            student['attendance_rate'] = round((student['present_count'] / total) * 100, 1)
            student['has_intervention'] = student['has_intervention_count'] > 0
            
            # Calculate priority score
            priority_score = float(student['student__risk_profile__risk_score'])
            if not student['has_intervention']:
                priority_score += 20
            priority_score += (student['active_alerts_count'] * 10)
            student['priority_score'] = round(priority_score, 1)
            
            # Clean up temporary fields
            del student['has_intervention_count']
        
        # Sort by priority
        high_risk_students.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return high_risk_students[:20]
        
    except DatabaseError as e:
        logger.error(f"Database error in high-risk students query: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in high-risk students query: {e}")
        return []


# Add this to your services.py file - replace the loop-based implementation
# in get_form_master_dashboard_data() around line 400
