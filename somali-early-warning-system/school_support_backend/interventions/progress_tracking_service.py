"""
Progress Tracking Service
Tracks student risk scores over time and intervention effectiveness
"""

from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import timedelta
from students.models import Student
from interventions.models import InterventionCase


def calculate_student_risk(student, reference_date=None):
    from interventions.ai_recommendations import calculate_student_risk_score
    return calculate_student_risk_score(student)


def get_student_progress_timeline(student_id, weeks=4):
    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return {'error': 'Student not found'}

    today = timezone.now().date()
    current_risk = calculate_student_risk(student)

    timeline = [{
        'week': 'Current Week',
        'risk_score': current_risk['risk_score'],
        'attendance_rate': current_risk.get('attendance_rate', 0),
        'date': today.isoformat()
    }]

    interventions = InterventionCase.objects.filter(
        student=student,
        created_at__gte=today - timedelta(weeks=weeks)
    ).values('case_id', 'status', 'progress_status', 'created_at', 'meeting_notes')

    interventions_list = [{
        'case_id': i['case_id'],
        'type': 'Intervention Case',
        'date': i['created_at'].date().isoformat(),
        'status': i['progress_status'],
        'notes': i['meeting_notes'][:100] if i['meeting_notes'] else 'No notes'
    } for i in interventions]

    return {
        'student_id': student.student_id,
        'student_name': student.full_name,
        'timeline': timeline,
        'trend': 'stable',
        'total_change': 0,
        'interventions_applied': interventions_list
    }


def _get_cases_for_user(request_user=None, classroom_id=None):
    """
    Central queryset — scoped to the form master's assigned cases
    AND their classroom. Prevents cross-classroom data leaks.
    """
    cases = InterventionCase.objects.all()

    # Always scope to assigned cases for form masters (IDOR protection)
    if request_user and request_user.role == 'form_master':
        cases = cases.filter(assigned_to=request_user)

    # Further scope to classroom enrollment
    if classroom_id:
        cases = cases.filter(
            student__enrollments__classroom_id=classroom_id,
            student__enrollments__is_active=True
        )

    return cases


def get_intervention_effectiveness(classroom_id=None, request_user=None):
    cases = _get_cases_for_user(request_user, classroom_id)
    total_cases = cases.count()

    if total_cases == 0:
        return {
            'overall_stats': {
                'total_cases': 0, 'improved': 0,
                'not_improved': 0, 'ongoing': 0, 'success_rate': 0
            },
            'by_progress_status': [],
            'by_root_cause': []
        }

    improved = cases.filter(progress_status__in=['improving', 'resolved']).count()
    not_improved = cases.filter(progress_status='not_improving').count()
    ongoing = cases.filter(progress_status__in=['no_contact', 'contacted']).count()
    success_rate = round(improved / total_cases * 100, 1)

    status_stats = cases.values('progress_status').annotate(
        count=Count('case_id')
    ).order_by('-count')

    by_status = [{
        'status': s['progress_status'],
        'count': s['count'],
        'percentage': round(s['count'] / total_cases * 100, 1)
    } for s in status_stats]

    return {
        'overall_stats': {
            'total_cases': total_cases,
            'improved': improved,
            'not_improved': not_improved,
            'ongoing': ongoing,
            'success_rate': success_rate
        },
        'by_progress_status': by_status,
        'by_root_cause': []
    }


def identify_patterns(classroom_id=None, request_user=None):
    patterns = {'absence_patterns': [], 'intervention_patterns': []}
    cases = _get_cases_for_user(request_user, classroom_id)

    # Pattern 1: Quick vs delayed response
    total_quick = cases.filter(
        created_at__lte=F('alert__alert_date') + timedelta(days=3)
    ).count()
    quick_success = cases.filter(
        created_at__lte=F('alert__alert_date') + timedelta(days=3),
        progress_status__in=['improving', 'resolved']
    ).count()

    total_slow = cases.filter(
        created_at__gt=F('alert__alert_date') + timedelta(days=3)
    ).count()
    slow_success = cases.filter(
        created_at__gt=F('alert__alert_date') + timedelta(days=3),
        progress_status__in=['improving', 'resolved']
    ).count()

    if total_quick > 0:
        patterns['intervention_patterns'].append({
            'pattern': 'Quick intervention response (within 3 days)',
            'success_rate': round(quick_success / total_quick * 100, 1),
            'student_count': total_quick,
            'recommendation': 'Respond to alerts within 3 days for best results'
        })

    if total_slow > 0:
        patterns['intervention_patterns'].append({
            'pattern': 'Delayed intervention response (after 3 days)',
            'success_rate': round(slow_success / total_slow * 100, 1),
            'student_count': total_slow,
            'recommendation': 'Avoid delays — success rate drops significantly'
        })

    # Pattern 2: Follow-up meetings
    total_followup = cases.filter(follow_up_date__isnull=False).count()
    followup_success = cases.filter(
        follow_up_date__isnull=False,
        progress_status__in=['improving', 'resolved']
    ).count()

    if total_followup > 0:
        patterns['intervention_patterns'].append({
            'pattern': 'Cases with scheduled follow-ups',
            'success_rate': round(followup_success / total_followup * 100, 1),
            'student_count': total_followup,
            'recommendation': 'Always schedule follow-up meetings for better outcomes'
        })

    return patterns


def get_improving_students(classroom_id=None, request_user=None):
    cases = _get_cases_for_user(request_user, classroom_id)

    improving_cases = cases.filter(
        progress_status__in=['improving', 'resolved']
    ).select_related('student__risk_profile').order_by('-updated_at')

    seen = set()
    result = []
    for case in improving_cases:
        sid = case.student.student_id
        if sid in seen:
            continue
        seen.add(sid)
        risk_score = 0
        if hasattr(case.student, 'risk_profile') and case.student.risk_profile:
            risk_score = case.student.risk_profile.risk_score or 0
        result.append({
            'student_id': sid,
            'name': case.student.full_name,
            'progress_status': case.progress_status,
            'current_risk': risk_score,
            'case_id': case.case_id,
            'updated_at': case.updated_at.date().isoformat(),
        })
        if len(result) >= 10:
            break
    return result


def get_declining_students(classroom_id=None, request_user=None):
    today = timezone.now()
    cases = _get_cases_for_user(request_user, classroom_id)

    declining_cases = cases.filter(
        Q(progress_status='not_improving') |
        Q(progress_status='no_contact', created_at__lte=today - timedelta(days=14))
    ).exclude(status='closed').select_related('student__risk_profile').order_by('created_at')

    seen = set()
    result = []
    for case in declining_cases:
        sid = case.student.student_id
        if sid in seen:
            continue
        seen.add(sid)
        risk_score = 0
        if hasattr(case.student, 'risk_profile') and case.student.risk_profile:
            risk_score = case.student.risk_profile.risk_score or 0
        result.append({
            'student_id': sid,
            'name': case.student.full_name,
            'progress_status': case.progress_status,
            'current_risk': risk_score,
            'case_id': case.case_id,
            'days_open': (today - case.created_at).days,
        })
        if len(result) >= 10:
            break
    return result


def get_progress_dashboard_data(classroom_id=None, request_user=None):
    return {
        'intervention_effectiveness': get_intervention_effectiveness(classroom_id, request_user),
        'patterns': identify_patterns(classroom_id, request_user),
        'top_improving_students': get_improving_students(classroom_id, request_user),
        'students_needing_attention': get_declining_students(classroom_id, request_user),
    }
