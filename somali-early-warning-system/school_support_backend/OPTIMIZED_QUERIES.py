# Optimized Dashboard Queries
# Replace in dashboard/services.py

from django.db.models import Prefetch, Count, Q, F
from django.core.cache import cache

def get_form_master_dashboard_data(user):
    """
    Optimized dashboard data with proper query optimization
    Handles 50,000+ students efficiently
    """
    
    # =====================================================
    # CACHE FREQUENTLY ACCESSED DATA
    # =====================================================
    cache_key = f'dashboard_{user.id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    # =====================================================
    # OPTIMIZED QUERIES - Use select_related & prefetch_related
    # =====================================================
    
    # High-risk students with related data (1 query instead of N+1)
    high_risk_students = Student.objects.filter(
        risk_profile__risk_level__in=['HIGH', 'CRITICAL'],
        is_active=True
    ).select_related(
        'risk_profile',
        'classroom'
    ).prefetch_related(
        'attendance_records'
    ).only(
        'student_id', 'full_name', 'grade_level',
        'risk_profile__risk_level', 'risk_profile__risk_score',
        'classroom__name'
    )[:100]  # Limit to 100 for performance
    
    # Urgent alerts with student data (1 query)
    urgent_alerts = Alert.objects.filter(
        assigned_to=user,
        status__in=['active', 'under_review']
    ).select_related(
        'student',
        'subject'
    ).only(
        'alert_id', 'alert_type', 'risk_level', 'status',
        'student__full_name', 'subject__name'
    ).order_by('-alert_date')[:50]
    
    # Pending cases with student and risk data (1 query)
    pending_cases = InterventionCase.objects.filter(
        assigned_to=user,
        status__in=['open', 'in_progress']
    ).select_related(
        'student',
        'student__risk_profile'
    ).only(
        'case_id', 'status', 'progress_status', 'version',
        'meeting_date', 'meeting_notes', 'created_at',
        'student__full_name', 'student__student_id',
        'student__risk_profile__risk_level'
    ).order_by('-created_at')[:100]
    
    # =====================================================
    # AGGREGATED QUERIES - Use database aggregation
    # =====================================================
    
    # Count queries (efficient)
    stats = {
        'total_students': Student.objects.filter(is_active=True).count(),
        'high_risk_count': Student.objects.filter(
            risk_profile__risk_level__in=['HIGH', 'CRITICAL']
        ).count(),
        'active_alerts': Alert.objects.filter(
            assigned_to=user,
            status='active'
        ).count(),
        'open_cases': InterventionCase.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress']
        ).count(),
    }
    
    # =====================================================
    # CLASSROOM STATS - Aggregated query
    # =====================================================
    classroom_stats = Classroom.objects.annotate(
        total_students=Count('students', filter=Q(students__is_active=True)),
        high_risk_count=Count(
            'students',
            filter=Q(
                students__risk_profile__risk_level__in=['HIGH', 'CRITICAL'],
                students__is_active=True
            )
        )
    ).values('name', 'total_students', 'high_risk_count')[:20]
    
    # =====================================================
    # BUILD RESPONSE
    # =====================================================
    data = {
        'high_risk_students': list(high_risk_students),
        'urgent_alerts': list(urgent_alerts),
        'pending_cases': list(pending_cases),
        'immediate_attention': list(high_risk_students[:10]),
        'classroom_stats': list(classroom_stats),
        **stats
    }
    
    # Cache for 5 minutes
    cache.set(cache_key, data, 300)
    
    return data


# =====================================================
# QUERY PERFORMANCE MONITORING
# =====================================================
from django.db import connection
from django.utils.deprecation import MiddlewareMixin

class QueryCountDebugMiddleware(MiddlewareMixin):
    """Log number of queries per request"""
    
    def process_response(self, request, response):
        if len(connection.queries) > 20:
            print(f'⚠️ WARNING: {len(connection.queries)} queries on {request.path}')
            for query in connection.queries:
                if float(query['time']) > 0.5:
                    print(f'🐌 SLOW QUERY ({query["time"]}s): {query["sql"][:100]}')
        return response
