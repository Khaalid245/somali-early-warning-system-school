from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncMonth
from datetime import timedelta, date
from django.db import models

from students.models import Student, StudentEnrollment
from alerts.models import Alert
from interventions.models import InterventionCase
from risk.models import StudentRiskProfile
from attendance.models import AttendanceRecord, AttendanceSession
from academics.models import TeachingAssignment
from .cache_utils import get_cache_key, cache_dashboard_data, get_cached_dashboard_data


def apply_date_filter(queryset, filters, date_field):
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")

    if start_date:
        queryset = queryset.filter(**{f"{date_field}__gte": start_date})
    if end_date:
        queryset = queryset.filter(**{f"{date_field}__lte": end_date})

    return queryset


def calculate_percentage_change(current, previous):
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 2)


def get_trend_direction(percent):
    if percent > 0:
        return "up"
    elif percent < 0:
        return "down"
    return "stable"


def get_monthly_trend(model, date_field, base_filter=None, months=6):
    if base_filter is None:
        base_filter = {}

    now = timezone.now()
    start_date = (now - timedelta(days=months * 30)).replace(day=1)

    queryset = model.objects.filter(
        **base_filter,
        **{f"{date_field}__gte": start_date}
    )

    monthly_data = (
        queryset
        .annotate(month=TruncMonth(date_field))
        .values("month")
        .annotate(count=Count("*"))
        .order_by("month")
    )

    return [
        {
            "month": item["month"].strftime("%Y-%m"),
            "count": item["count"]
        }
        for item in monthly_data
    ]


def get_monthly_counts(model, date_field, base_filter):
    now = timezone.now()

    first_day_current = now.replace(day=1)
    first_day_previous = (first_day_current - timedelta(days=1)).replace(day=1)

    current_qs = model.objects.filter(
        **base_filter,
        **{f"{date_field}__gte": first_day_current}
    )

    previous_qs = model.objects.filter(
        **base_filter,
        **{
            f"{date_field}__gte": first_day_previous,
            f"{date_field}__lt": first_day_current
        }
    )

    return current_qs.count(), previous_qs.count()


def get_admin_dashboard_data(user, filters):
    # Count only students with active enrollments
    total_students = Student.objects.filter(
        is_active=True,
        enrollments__is_active=True
    ).distinct().count()

    active_alerts_qs = Alert.objects.filter(
        status__in=["active", "under_review", "escalated"]
    )
    active_alerts_qs = apply_date_filter(active_alerts_qs, filters, "alert_date")

    if filters.get("risk_level"):
        active_alerts_qs = active_alerts_qs.filter(risk_level=filters["risk_level"])

    active_alerts = active_alerts_qs.count()

    current_alerts, previous_alerts = get_monthly_counts(
        Alert, "alert_date",
        {"status__in": ["active", "under_review", "escalated"]}
    )

    alert_change_percent = calculate_percentage_change(current_alerts, previous_alerts)

    open_cases_qs = InterventionCase.objects.filter(
        status__in=["open", "in_progress", "awaiting_parent"]
    )
    open_cases_qs = apply_date_filter(open_cases_qs, filters, "created_at")
    open_cases = open_cases_qs.count()

    current_cases, previous_cases = get_monthly_counts(
        InterventionCase, "created_at",
        {"status__in": ["open", "in_progress", "awaiting_parent"]}
    )

    case_change_percent = calculate_percentage_change(current_cases, previous_cases)

    monthly_alert_trend = get_monthly_trend(
        Alert, "alert_date",
        {"status__in": ["active", "under_review", "escalated"]}
    )

    monthly_case_trend = get_monthly_trend(
        InterventionCase, "created_at",
        {"status__in": ["open", "in_progress", "awaiting_parent"]}
    )

    case_status_breakdown = (
        open_cases_qs
        .values("status")
        .annotate(count=Count("case_id"))
    )

    return {
        "role": "admin",
        "total_students": total_students,
        "active_alerts": active_alerts,
        "active_alerts_change_percent": alert_change_percent,
        "active_alerts_trend": get_trend_direction(alert_change_percent),
        "open_cases": open_cases,
        "open_cases_change_percent": case_change_percent,
        "open_cases_trend": get_trend_direction(case_change_percent),
        "monthly_alert_trend": monthly_alert_trend,
        "monthly_case_trend": monthly_case_trend,
        "case_status_breakdown": list(case_status_breakdown),
    }


def get_form_master_dashboard_data(user, filters):
    from django.db.models import Count, Q, Avg
    from students.models import StudentEnrollment
    from academics.models import Classroom
    
    # Get classrooms assigned to this form master
    my_classrooms = Classroom.objects.filter(form_master=user)
    
    # Assigned alerts
    assigned_alerts_qs = Alert.objects.filter(
        assigned_to=user,
        status__in=["active", "under_review", "escalated"]
    )
    assigned_alerts = assigned_alerts_qs.count()

    current_alerts, previous_alerts = get_monthly_counts(
        Alert, "alert_date",
        {"assigned_to": user, "status__in": ["active", "under_review", "escalated"]}
    )
    alert_change_percent = calculate_percentage_change(current_alerts, previous_alerts)

    # Open cases
    open_cases_qs = InterventionCase.objects.filter(
        assigned_to=user,
        status__in=["open", "in_progress", "awaiting_parent"]
    )
    open_cases = open_cases_qs.count()

    current_cases, previous_cases = get_monthly_counts(
        InterventionCase, "created_at",
        {"assigned_to": user, "status__in": ["open", "in_progress", "awaiting_parent"]}
    )
    case_change_percent = calculate_percentage_change(current_cases, previous_cases)

    # Monthly trends
    monthly_alert_trend = get_monthly_trend(
        Alert, "alert_date",
        {"assigned_to": user, "status__in": ["active", "under_review", "escalated"]}
    )

    monthly_case_trend = get_monthly_trend(
        InterventionCase, "created_at",
        {"assigned_to": user, "status__in": ["open", "in_progress", "awaiting_parent"]}
    )

    # Urgent alerts (top 5)
    urgent_alerts = list(
        Alert.objects
        .filter(assigned_to=user, status__in=["active", "escalated"])
        .select_related("student", "subject")
        .order_by("-risk_level", "-alert_date")
        .values(
            "alert_id",
            "student__full_name",
            "student__student_id",
            "subject__name",
            "alert_type",
            "risk_level",
            "status",
            "alert_date"
        )[:5]
    )

    # Cases needing attention
    pending_cases = list(
        InterventionCase.objects
        .filter(assigned_to=user, status__in=["open", "in_progress", "awaiting_parent"])
        .select_related("student", "alert", "student__risk_profile")
        .order_by("-created_at")
        .values(
            "case_id",
            "student__full_name",
            "student__student_id",
            "student__risk_profile__risk_level",
            "status",
            "follow_up_date",
            "created_at",
            "meeting_date",
            "meeting_notes",
            "progress_status"
        )[:10]
    )

    # Case status breakdown
    case_status_breakdown = list(
        open_cases_qs
        .values("status")
        .annotate(count=Count("case_id"))
    )

    # Escalated cases count
    escalated_cases = InterventionCase.objects.filter(
        assigned_to=user,
        status="escalated_to_admin"
    ).count()

    # High-risk students with detailed attendance
    high_risk_students = []
    for enrollment in StudentEnrollment.objects.filter(
        classroom__in=my_classrooms,
        is_active=True
    ).select_related('student', 'student__risk_profile'):
        
        student = enrollment.student
        
        if not hasattr(student, 'risk_profile') or student.risk_profile.risk_level not in ['high', 'critical']:
            continue
            
        # Get attendance stats
        total_records = AttendanceRecord.objects.filter(student=student).count()
        absent_count = AttendanceRecord.objects.filter(student=student, status='absent').count()
        late_count = AttendanceRecord.objects.filter(student=student, status='late').count()
        present_count = AttendanceRecord.objects.filter(student=student, status='present').count()
        
        attendance_rate = 0
        if total_records > 0:
            attendance_rate = round((present_count / total_records) * 100, 1)
        
        # Calculate priority score
        priority_score = float(student.risk_profile.risk_score)
        
        # Check open cases
        open_cases_count = InterventionCase.objects.filter(
            student=student,
            status__in=['open', 'in_progress', 'awaiting_parent']
        ).count()
        
        # Check if no intervention yet
        has_intervention = InterventionCase.objects.filter(student=student).exists()
        if not has_intervention:
            priority_score += 20  # Boost priority if no intervention
        
        # Check last follow-up
        last_case = InterventionCase.objects.filter(student=student).order_by('-created_at').first()
        days_since_followup = 999
        if last_case and last_case.follow_up_date:
            days_since_followup = (timezone.now().date() - last_case.follow_up_date).days
            if days_since_followup > 7:
                priority_score += 15  # Boost if overdue
        
        # Check active alerts
        active_alerts_count = Alert.objects.filter(
            student=student,
            status__in=['active', 'under_review']
        ).count()
        priority_score += (active_alerts_count * 10)
        
        high_risk_students.append({
            'student__student_id': student.student_id,
            'student__full_name': student.full_name,
            'risk_level': student.risk_profile.risk_level,
            'risk_score': float(student.risk_profile.risk_score),
            'priority_score': round(priority_score, 1),
            'total_sessions': total_records,
            'absent_count': absent_count,
            'late_count': late_count,
            'attendance_rate': attendance_rate,
            'classroom': enrollment.classroom.name,
            'open_cases_count': open_cases_count,
            'has_intervention': has_intervention,
            'days_since_followup': days_since_followup if days_since_followup < 999 else None,
            'active_alerts_count': active_alerts_count
        })
    
    # Sort by priority score (highest first)
    high_risk_students.sort(key=lambda x: x['priority_score'], reverse=True)
    high_risk_count = len(high_risk_students)

    # Classroom statistics
    classroom_stats = []
    for classroom in my_classrooms:
        total_students = StudentEnrollment.objects.filter(
            classroom=classroom,
            is_active=True
        ).count()
        
        from datetime import timedelta
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        recent_records = AttendanceRecord.objects.filter(
            session__classroom=classroom,
            session__attendance_date__gte=thirty_days_ago
        )
        
        total_records = recent_records.count()
        absent = recent_records.filter(status='absent').count()
        late = recent_records.filter(status='late').count()
        present = recent_records.filter(status='present').count()
        
        attendance_rate = 0
        if total_records > 0:
            attendance_rate = round((present / total_records) * 100, 1)
        
        # Calculate classroom risk health
        avg_risk = StudentRiskProfile.objects.filter(
            student__enrollments__classroom=classroom,
            student__enrollments__is_active=True
        ).aggregate(avg=Avg('risk_score'))['avg'] or 0
        
        health_status = 'healthy'
        if avg_risk >= 60:
            health_status = 'critical'
        elif avg_risk >= 30:
            health_status = 'moderate'
        
        classroom_stats.append({
            'classroom_id': classroom.class_id,
            'classroom_name': classroom.name,
            'total_students': total_students,
            'attendance_rate': attendance_rate,
            'absent_count': absent,
            'late_count': late,
            'present_count': present,
            'avg_risk_score': round(float(avg_risk), 1),
            'health_status': health_status
        })

    # Overdue follow-ups
    overdue_cases = InterventionCase.objects.filter(
        assigned_to=user,
        follow_up_date__lt=timezone.now().date(),
        status__in=['open', 'in_progress', 'awaiting_parent']
    ).count()
    
    # Students needing immediate attention (top 5)
    immediate_attention = [s for s in high_risk_students if not s['has_intervention'] or s['days_since_followup'] and s['days_since_followup'] > 7][:5]

    return {
        "role": "form_master",
        "assigned_alerts": assigned_alerts,
        "alert_change_percent": alert_change_percent,
        "alert_trend_direction": get_trend_direction(alert_change_percent),
        "open_cases": open_cases,
        "case_change_percent": case_change_percent,
        "case_trend_direction": get_trend_direction(case_change_percent),
        "high_risk_count": high_risk_count,
        "escalated_cases": escalated_cases,
        "monthly_alert_trend": monthly_alert_trend,
        "monthly_case_trend": monthly_case_trend,
        "urgent_alerts": urgent_alerts,
        "pending_cases": pending_cases,
        "case_status_breakdown": case_status_breakdown,
        "high_risk_students": high_risk_students[:20],
        "classroom_stats": classroom_stats,
        "overdue_cases": overdue_cases,
        "immediate_attention": immediate_attention,
    }


def get_teacher_dashboard_data(user, filters):
    from django.db.models import Prefetch
    
    # Check cache first
    cache_key = get_cache_key('teacher', user.id, filters)
    cached_data = get_cached_dashboard_data(cache_key)
    if cached_data:
        return cached_data
    
    today = timezone.now().date()
    
    # Handle time range filters
    time_range = filters.get('time_range', 'current_month')  # default to current month
    date_range = _get_date_range(time_range, today)

    # Optimized query: Get teaching assignments with related data in one query
    teaching_assignments = TeachingAssignment.objects.filter(
        teacher=user,
        is_active=True
    ).select_related('subject', 'classroom').prefetch_related(
        Prefetch(
            'subject__alerts',
            queryset=Alert.objects.filter(
                status__in=["active", "under_review", "escalated"]
            ).select_related('student')
        )
    )
    
    teacher_subjects = [assignment.subject.subject_id for assignment in teaching_assignments]

    # If no subjects assigned, return helpful guidance
    if not teacher_subjects:
        empty_dashboard = {
            "role": "teacher",
            "empty_dashboard_guidance": {
                "status": "no_assignments",
                "message": "No subjects assigned yet. Please contact your administrator to get started.",
                "contact_admin": True,
                "onboarding_steps": [
                    "Contact your administrator for subject assignments",
                    "Once assigned, you can take daily attendance",
                    "Monitor student alerts and risk indicators",
                    "Track attendance trends over time"
                ]
            },
            "today_absent_count": 0,
            "absent_change_percent": 0,
            "absent_trend_direction": "stable",
            "active_alerts": 0,
            "alert_change_percent": 0,
            "alert_trend_direction": "stable",
            "monthly_absence_trend": [],
            "monthly_alert_trend": [],
            "high_risk_students": [],
            "urgent_alerts": [],
            "my_classes": [],
            "action_items": [],
            "weekly_attendance_summary": {},
            "time_range_info": {
                "current_range": "No Data",
                "start_date": today.isoformat(),
                "end_date": today.isoformat()
            }
        }
        return cache_dashboard_data(cache_key, empty_dashboard, timeout=60)  # Cache for 1 minute only

    # Optimized attendance query with single database hit
    attendance_stats = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects
    ).select_related('session').aggregate(
        today_absent=Count('record_id', filter=models.Q(
            session__attendance_date=today,
            status='absent'
        )),
        current_month_absent=Count('record_id', filter=models.Q(
            session__attendance_date__gte=timezone.now().replace(day=1).date(),
            status='absent'
        )),
        previous_month_absent=Count('record_id', filter=models.Q(
            session__attendance_date__gte=(timezone.now().replace(day=1) - timedelta(days=1)).replace(day=1).date(),
            session__attendance_date__lt=timezone.now().replace(day=1).date(),
            status='absent'
        ))
    )
    
    absent_today = attendance_stats['today_absent'] or 0
    current_absent = attendance_stats['current_month_absent'] or 0
    previous_absent = attendance_stats['previous_month_absent'] or 0

    absent_change_percent = calculate_percentage_change(current_absent, previous_absent)

    # Optimized alerts query with aggregation
    alert_stats = Alert.objects.filter(
        subject_id__in=teacher_subjects
    ).aggregate(
        active_alerts=Count('alert_id', filter=Q(
            status__in=["active", "under_review", "escalated"]
        )),
        current_month_alerts=Count('alert_id', filter=Q(
            alert_date__gte=timezone.now().replace(day=1).date(),
            status__in=["active", "under_review", "escalated"]
        )),
        previous_month_alerts=Count('alert_id', filter=Q(
            alert_date__gte=(timezone.now().replace(day=1) - timedelta(days=1)).replace(day=1).date(),
            alert_date__lt=timezone.now().replace(day=1).date(),
            status__in=["active", "under_review", "escalated"]
        ))
    )
    
    active_alerts = alert_stats['active_alerts'] or 0
    current_alerts = alert_stats['current_month_alerts'] or 0
    previous_alerts = alert_stats['previous_month_alerts'] or 0
    alert_change_percent = calculate_percentage_change(current_alerts, previous_alerts)

    # Get trends (keeping existing logic for now)
    monthly_absence_trend = get_monthly_trend(
        AttendanceRecord, "session__attendance_date",
        {"session__subject_id__in": teacher_subjects, "status": "absent"}
    )

    monthly_alert_trend = get_monthly_trend(
        Alert, "alert_date",
        {
            "subject_id__in": teacher_subjects,
            "status__in": ["active", "under_review", "escalated"]
        }
    )

    # Optimized high-risk students query with visual indicators
    high_risk_students_raw = StudentRiskProfile.objects.filter(
        risk_level__in=["high", "critical"],
        student__attendance_records__session__subject_id__in=teacher_subjects
    ).select_related('student').values(
        "student__full_name", "student__student_id", "student__admission_number",
        "risk_level", "risk_score", "last_calculated"
    ).distinct()[:10]
    
    # Add visual indicators and context
    high_risk_students = [
        {
            **student,
            'visual_indicator': _get_risk_visual_indicator(student['risk_level'], student['risk_score']),
            'context': _get_student_context(student['student__student_id'], teacher_subjects),
            'urgency_level': _calculate_urgency_level(student['risk_level'], student['risk_score']),
            'suggested_action': _get_suggested_action(student['risk_level'], student['student__student_id'], teacher_subjects),
            'days_since_update': (timezone.now().date() - student['last_calculated'].date()).days if student.get('last_calculated') else None
        }
        for student in high_risk_students_raw
    ]

    # Optimized urgent alerts query with visual indicators
    urgent_alerts_raw = Alert.objects.filter(
        subject_id__in=teacher_subjects,
        status__in=["active", "escalated"]
    ).select_related("student", "subject").order_by("-risk_level", "-alert_date").values(
        "alert_id", "student__full_name", "student__student_id", "subject__name",
        "alert_type", "risk_level", "status", "alert_date"
    )[:5]
    
    # Add visual indicators to urgent alerts
    urgent_alerts = [
        {
            **alert,
            'visual_indicators': {
                'status_badge': _get_alert_visual_indicator(alert['risk_level'], alert['status'])['badge'],
                'days_since_created': (today - alert['alert_date'].date()).days if hasattr(alert['alert_date'], 'date') else (today - alert['alert_date']).days,
                'urgency_score': _calculate_alert_urgency(alert['risk_level'], alert['status'], alert['alert_date'].date() if hasattr(alert['alert_date'], 'date') else alert['alert_date'])
            }
        }
        for alert in urgent_alerts_raw
    ]

    # Use the already fetched teaching assignments
    my_classes = [
        {
            "assignment_id": assignment.assignment_id,
            "classroom__name": assignment.classroom.name,
            "classroom__class_id": assignment.classroom.class_id,
            "subject__name": assignment.subject.name,
            "subject__subject_id": assignment.subject.subject_id,
            "student_count": StudentEnrollment.objects.filter(
                classroom=assignment.classroom, is_active=True
            ).count(),
            "recent_attendance_rate": _get_class_attendance_rate(assignment, today)
        }
        for assignment in teaching_assignments
    ]
    
    # Teacher-specific features
    teacher_features = {
        "pending_attendance_sessions": _get_pending_sessions(teacher_subjects, today),
        "student_progress_alerts": _get_student_progress_alerts(teacher_subjects),
        "weekly_attendance_summary": _get_weekly_attendance_summary(teacher_subjects, today),
        "action_items": _generate_action_items(absent_today, active_alerts, urgent_alerts, teacher_subjects),
        "semester_comparison": _get_semester_comparison(teacher_subjects, today),
        "student_progress_tracking": _get_student_progress_tracking(teacher_subjects, today),
        "insights": _generate_insights(absent_today, active_alerts, teacher_subjects, today)
    }

    return cache_dashboard_data(cache_key, {
        "role": "teacher",
        "time_range_info": {
            "current_range": date_range['display_name'],
            "start_date": date_range['start_date'].isoformat(),
            "end_date": date_range['end_date'].isoformat()
        },
        "today_absent_count": absent_today,
        "absent_change_percent": absent_change_percent,
        "absent_trend_direction": get_trend_direction(absent_change_percent),
        "active_alerts": active_alerts,
        "alert_change_percent": alert_change_percent,
        "alert_trend_direction": get_trend_direction(alert_change_percent),
        "monthly_absence_trend": monthly_absence_trend,
        "monthly_alert_trend": monthly_alert_trend,
        "high_risk_students": high_risk_students,
        "urgent_alerts": urgent_alerts,
        "my_classes": my_classes,
        **teacher_features  # Add teacher-specific features
    })


# Helper functions for teacher-specific features
def _get_class_attendance_rate(assignment, today):
    """Get recent attendance rate for a specific class"""
    week_ago = today - timedelta(days=7)
    recent_records = AttendanceRecord.objects.filter(
        session__classroom=assignment.classroom,
        session__subject=assignment.subject,
        session__attendance_date__gte=week_ago
    )
    total = recent_records.count()
    if total == 0:
        return None
    present = recent_records.filter(status='present').count()
    return round((present / total) * 100, 1)


def _get_pending_sessions(teacher_subjects, today):
    """Get sessions that need attendance to be recorded"""
    return list(AttendanceSession.objects.filter(
        subject_id__in=teacher_subjects,
        attendance_date=today
    ).exclude(
        records__isnull=False
    ).values(
        'session_id', 'classroom__name', 'subject__name', 'attendance_date'
    )[:5])


def _get_student_progress_alerts(teacher_subjects):
    """Get students showing declining performance"""
    return list(Alert.objects.filter(
        subject_id__in=teacher_subjects,
        alert_type='academic_performance',
        status='active'
    ).select_related('student').values(
        'student__full_name', 'student__student_id', 'subject__name', 'alert_date'
    )[:5])


def _get_weekly_attendance_summary(teacher_subjects, today):
    """Get weekly attendance summary by day"""
    week_ago = today - timedelta(days=7)
    weekly_summary = {}
    
    for i in range(7):
        day = week_ago + timedelta(days=i)
        stats = AttendanceRecord.objects.filter(
            session__subject_id__in=teacher_subjects,
            session__attendance_date=day
        ).aggregate(
            total=Count('record_id'),
            present=Count('record_id', filter=Q(status='present')),
            absent=Count('record_id', filter=Q(status='absent')),
            late=Count('record_id', filter=Q(status='late'))
        )
        
        day_name = day.strftime('%A').lower()
        total = stats['total'] or 0
        present = stats['present'] or 0
        rate = round((present / max(total, 1)) * 100, 1) if total > 0 else 0
        
        weekly_summary[day_name] = {
            'total': total,
            'present': present,
            'absent': stats['absent'] or 0,
            'late': stats['late'] or 0,
            'rate': f"{rate}%"
        }
    
    return weekly_summary


def _generate_action_items(absent_today, active_alerts, urgent_alerts, teacher_subjects=None):
    """Generate actionable items with AI-powered recommendations"""
    items = []
    
    # Critical priority items
    if len(urgent_alerts) > 0:
        critical_students = [a['student__full_name'] for a in urgent_alerts[:3]]
        items.append({
            'category': 'Urgent Intervention Required',
            'description': f'Immediate attention needed for {len(urgent_alerts)} students',
            'priority': 'Critical',
            'count': len(urgent_alerts),
            'action': f"Contact: {', '.join(critical_students)}",
            'recommendation': 'Schedule one-on-one meetings today'
        })
    
    # High priority items
    if absent_today > 5:
        items.append({
            'category': 'High Absence Rate',
            'description': f'{absent_today} students absent today - above threshold',
            'priority': 'High',
            'count': absent_today,
            'action': 'Review attendance patterns',
            'recommendation': 'Check for common factors (illness, events, weather)'
        })
    elif absent_today > 0:
        items.append({
            'category': 'Attendance Follow-up',
            'description': f'Follow up with {absent_today} students absent today',
            'priority': 'Medium',
            'count': absent_today,
            'action': 'Contact parents/guardians',
            'recommendation': 'Send absence notification by end of day'
        })
    
    # Alert management
    if active_alerts > 3:
        items.append({
            'category': 'Alert Backlog',
            'description': f'{active_alerts} active alerts need review',
            'priority': 'High',
            'count': active_alerts,
            'action': 'Prioritize by risk level',
            'recommendation': 'Address critical alerts first, delegate medium alerts'
        })
    elif active_alerts > 0:
        items.append({
            'category': 'Alert Review',
            'description': f'Review {active_alerts} active student alerts',
            'priority': 'Medium',
            'count': active_alerts,
            'action': 'Update alert status',
            'recommendation': 'Document interventions taken'
        })
    
    # Proactive recommendations
    if teacher_subjects:
        week_ago = timezone.now().date() - timedelta(days=7)
        declining_students = AttendanceRecord.objects.filter(
            session__subject_id__in=teacher_subjects,
            session__attendance_date__gte=week_ago,
            status='absent'
        ).values('student__full_name').annotate(count=Count('record_id')).filter(count__gte=3)
        
        if declining_students.exists():
            items.append({
                'category': 'Declining Attendance Pattern',
                'description': f'{declining_students.count()} students with 3+ absences this week',
                'priority': 'High',
                'count': declining_students.count(),
                'action': 'Early intervention',
                'recommendation': 'Create alerts before patterns worsen'
            })
    
    if not items:
        items.append({
            'category': 'All Clear',
            'description': 'All caught up! Great work maintaining student engagement.',
            'priority': 'Low',
            'count': 0,
            'action': 'Continue monitoring',
            'recommendation': 'Review weekly trends for early warning signs'
        })
    
    return sorted(items, key=lambda x: {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}[x['priority']])


def _get_date_range(time_range, today):
    """Get start and end dates based on time range selection"""
    if time_range == 'current_week':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif time_range == 'current_month':
        start_date = today.replace(day=1)
        next_month = start_date.replace(month=start_date.month + 1) if start_date.month < 12 else start_date.replace(year=start_date.year + 1, month=1)
        end_date = next_month - timedelta(days=1)
    elif time_range == 'current_semester':
        # Assume semester starts in September or February
        if today.month >= 9:  # Fall semester
            start_date = date(today.year, 9, 1)
            end_date = date(today.year + 1, 1, 31)
        elif today.month >= 2:  # Spring semester
            start_date = date(today.year, 2, 1)
            end_date = date(today.year, 6, 30)
        else:  # Winter break, show fall semester
            start_date = date(today.year - 1, 9, 1)
            end_date = date(today.year, 1, 31)
    elif time_range == 'academic_year':
        # Academic year starts in September
        if today.month >= 9:
            start_date = date(today.year, 9, 1)
            end_date = date(today.year + 1, 6, 30)
        else:
            start_date = date(today.year - 1, 9, 1)
            end_date = date(today.year, 6, 30)
    else:  # default to current month
        start_date = today.replace(day=1)
        next_month = start_date.replace(month=start_date.month + 1) if start_date.month < 12 else start_date.replace(year=start_date.year + 1, month=1)
        end_date = next_month - timedelta(days=1)
    
    return {
        'start_date': start_date,
        'end_date': end_date,
        'range_name': time_range,
        'display_name': _get_range_display_name(time_range, start_date, end_date)
    }


def _get_range_display_name(time_range, start_date, end_date):
    """Get human-readable display name for date range"""
    range_names = {
        'current_week': f"This Week ({start_date.strftime('%b %d')} - {end_date.strftime('%b %d')})",
        'current_month': f"{start_date.strftime('%B %Y')}",
        'current_semester': f"Current Semester ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})",
        'academic_year': f"Academic Year {start_date.year}-{end_date.year}"
    }
    return range_names.get(time_range, f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d')}")


def _get_risk_visual_indicator(risk_level, risk_score):
    """Get visual indicator for student risk level"""
    indicators = {
        'critical': {'color': '#dc2626', 'icon': 'ALERT', 'badge': 'CRITICAL', 'priority': 1},
        'high': {'color': '#ea580c', 'icon': 'WARNING', 'badge': 'HIGH RISK', 'priority': 2},
        'medium': {'color': '#ca8a04', 'icon': 'CAUTION', 'badge': 'MEDIUM', 'priority': 3},
        'low': {'color': '#16a34a', 'icon': 'OK', 'badge': 'LOW RISK', 'priority': 4}
    }
    base_indicator = indicators.get(risk_level, indicators['medium'])
    base_indicator['intensity'] = 'high' if risk_score >= 80 else 'medium' if risk_score >= 60 else 'low'
    return base_indicator


def _get_alert_visual_indicator(risk_level, status):
    """Get visual indicator for alerts"""
    base_colors = {'critical': '#dc2626', 'high': '#ea580c', 'medium': '#ca8a04', 'low': '#16a34a'}
    status_icons = {'active': 'ACTIVE', 'escalated': 'URGENT', 'under_review': 'REVIEW'}
    return {
        'color': base_colors.get(risk_level, '#6b7280'),
        'icon': status_icons.get(status, 'NORMAL'),
        'badge': f"{risk_level.upper()} - {status.replace('_', ' ').title()}",
        'pulse': status == 'escalated'
    }


def _get_student_context(student_id, teacher_subjects):
    """Get contextual information about student"""
    try:
        recent_attendance = AttendanceRecord.objects.filter(
            student_id=student_id,
            session__subject_id__in=teacher_subjects,
            session__attendance_date__gte=timezone.now().date() - timedelta(days=14)
        ).aggregate(
            total=Count('record_id'),
            present=Count('record_id', filter=Q(status='present'))
        )
        total = recent_attendance['total'] or 1
        return {
            'recent_attendance_rate': round((recent_attendance['present'] or 0) / total * 100, 1),
            'has_recent_data': total > 0
        }
    except:
        return {'recent_attendance_rate': 0, 'has_recent_data': False}


def _calculate_urgency_level(risk_level, risk_score):
    """Calculate urgency level for prioritization"""
    base_urgency = {'critical': 90, 'high': 70, 'medium': 50, 'low': 30}.get(risk_level, 50)
    score_adjustment = (float(risk_score) - 50) * 0.5
    return min(100, max(0, base_urgency + score_adjustment))


def _calculate_alert_urgency(risk_level, status, alert_date):
    """Calculate alert urgency score"""
    base_score = {'critical': 90, 'high': 70, 'medium': 50, 'low': 30}.get(risk_level, 50)
    status_multiplier = {'escalated': 1.5, 'active': 1.0, 'under_review': 0.8}.get(status, 1.0)
    
    # Handle both date and datetime objects
    if hasattr(alert_date, 'date'):
        alert_date = alert_date.date()
    
    days_old = (timezone.now().date() - alert_date).days
    time_urgency = min(20, days_old * 2)
    return min(100, (base_score * status_multiplier) + time_urgency)


def _get_suggested_action(risk_level, student_id, teacher_subjects):
    """Get suggested action for high-risk student"""
    from attendance.models import AttendanceRecord
    
    # Check recent absences
    week_ago = timezone.now().date() - timedelta(days=7)
    recent_absences = AttendanceRecord.objects.filter(
        student_id=student_id,
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=week_ago,
        status='absent'
    ).count()
    
    if risk_level == 'critical':
        if recent_absences >= 3:
            return 'Immediate parent meeting required - Multiple absences'
        return 'Schedule urgent intervention meeting'
    elif risk_level == 'high':
        if recent_absences >= 2:
            return 'Contact parent about attendance pattern'
        return 'Monitor closely and provide support'
    return 'Continue regular monitoring'


def _get_semester_comparison(teacher_subjects, today):
    """Compare current semester with previous semester"""
    current_semester = _get_date_range('current_semester', today)
    
    # Calculate previous semester dates
    if current_semester['start_date'].month >= 9:  # Fall semester
        prev_start = date(current_semester['start_date'].year, 2, 1)
        prev_end = date(current_semester['start_date'].year, 6, 30)
    else:  # Spring semester
        prev_start = date(current_semester['start_date'].year - 1, 9, 1)
        prev_end = date(current_semester['start_date'].year, 1, 31)
    
    # Current semester stats
    current_stats = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=current_semester['start_date'],
        session__attendance_date__lte=current_semester['end_date']
    ).aggregate(
        total=Count('record_id'),
        present=Count('record_id', filter=Q(status='present')),
        absent=Count('record_id', filter=Q(status='absent'))
    )
    
    # Previous semester stats
    prev_stats = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=prev_start,
        session__attendance_date__lte=prev_end
    ).aggregate(
        total=Count('record_id'),
        present=Count('record_id', filter=Q(status='present')),
        absent=Count('record_id', filter=Q(status='absent'))
    )
    
    current_rate = round((current_stats['present'] or 0) / max(current_stats['total'] or 1, 1) * 100, 1)
    prev_rate = round((prev_stats['present'] or 0) / max(prev_stats['total'] or 1, 1) * 100, 1)
    
    return {
        'current_semester': {
            'attendance_rate': current_rate,
            'total_sessions': current_stats['total'] or 0,
            'absent_count': current_stats['absent'] or 0,
            'period': f"{current_semester['start_date'].strftime('%b %Y')} - {current_semester['end_date'].strftime('%b %Y')}"
        },
        'previous_semester': {
            'attendance_rate': prev_rate,
            'total_sessions': prev_stats['total'] or 0,
            'absent_count': prev_stats['absent'] or 0,
            'period': f"{prev_start.strftime('%b %Y')} - {prev_end.strftime('%b %Y')}"
        },
        'comparison': {
            'rate_change': round(current_rate - prev_rate, 1),
            'trend': 'improving' if current_rate > prev_rate else 'declining' if current_rate < prev_rate else 'stable'
        }
    }


def _get_student_progress_tracking(teacher_subjects, today):
    """Track individual student progress over time"""
    thirty_days_ago = today - timedelta(days=30)
    sixty_days_ago = today - timedelta(days=60)
    
    students = Student.objects.filter(
        attendance_records__session__subject_id__in=teacher_subjects
    ).distinct()[:10]
    
    progress_data = []
    for student in students:
        # Recent 30 days
        recent = AttendanceRecord.objects.filter(
            student=student,
            session__subject_id__in=teacher_subjects,
            session__attendance_date__gte=thirty_days_ago
        ).aggregate(
            total=Count('record_id'),
            present=Count('record_id', filter=Q(status='present'))
        )
        
        # Previous 30 days
        previous = AttendanceRecord.objects.filter(
            student=student,
            session__subject_id__in=teacher_subjects,
            session__attendance_date__gte=sixty_days_ago,
            session__attendance_date__lt=thirty_days_ago
        ).aggregate(
            total=Count('record_id'),
            present=Count('record_id', filter=Q(status='present'))
        )
        
        recent_rate = round((recent['present'] or 0) / max(recent['total'] or 1, 1) * 100, 1)
        prev_rate = round((previous['present'] or 0) / max(previous['total'] or 1, 1) * 100, 1)
        
        progress_data.append({
            'student_name': student.full_name,
            'student_id': student.student_id,
            'recent_rate': recent_rate,
            'previous_rate': prev_rate,
            'trend': 'improving' if recent_rate > prev_rate else 'declining' if recent_rate < prev_rate else 'stable',
            'change': round(recent_rate - prev_rate, 1)
        })
    
    return sorted(progress_data, key=lambda x: abs(x['change']), reverse=True)[:5]


def _generate_insights(absent_today, active_alerts, teacher_subjects, today):
    """Generate AI-powered insights and recommendations"""
    insights = []
    
    # Attendance pattern insight
    week_ago = today - timedelta(days=7)
    weekly_absences = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=week_ago,
        status='absent'
    ).count()
    
    if weekly_absences > 20:
        insights.append({
            'type': 'warning',
            'title': 'High Weekly Absence Rate',
            'message': f'{weekly_absences} absences this week - significantly above normal',
            'recommendation': 'Consider class-wide intervention or check for external factors'
        })
    
    # Alert concentration insight
    if active_alerts > 5:
        alert_types = Alert.objects.filter(
            subject_id__in=teacher_subjects,
            status__in=['active', 'under_review']
        ).values('alert_type').annotate(count=Count('alert_id')).order_by('-count').first()
        
        if alert_types:
            insights.append({
                'type': 'info',
                'title': 'Alert Pattern Detected',
                'message': f"Most common alert: {alert_types['alert_type']} ({alert_types['count']} cases)",
                'recommendation': 'Consider targeted intervention strategy for this issue'
            })
    
    # Positive reinforcement
    if absent_today == 0 and active_alerts < 3:
        insights.append({
            'type': 'success',
            'title': 'Excellent Engagement',
            'message': 'Low absence rate and minimal alerts - students are engaged',
            'recommendation': 'Maintain current teaching strategies'
        })
    
    # Trend analysis
    month_ago = today - timedelta(days=30)
    two_months_ago = today - timedelta(days=60)
    
    recent_absences = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=month_ago,
        status='absent'
    ).count()
    
    prev_absences = AttendanceRecord.objects.filter(
        session__subject_id__in=teacher_subjects,
        session__attendance_date__gte=two_months_ago,
        session__attendance_date__lt=month_ago,
        status='absent'
    ).count()
    
    if recent_absences > prev_absences * 1.5:
        insights.append({
            'type': 'warning',
            'title': 'Declining Attendance Trend',
            'message': f'Absences increased {round((recent_absences/max(prev_absences,1)-1)*100)}% vs previous month',
            'recommendation': 'Investigate root causes and implement preventive measures'
        })
    elif recent_absences < prev_absences * 0.7:
        insights.append({
            'type': 'success',
            'title': 'Improving Attendance Trend',
            'message': f'Absences decreased {round((1-recent_absences/max(prev_absences,1))*100)}% vs previous month',
            'recommendation': 'Document successful strategies for future reference'
        })
    
    return insights
