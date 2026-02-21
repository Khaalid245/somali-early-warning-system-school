from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncMonth
from datetime import timedelta

from students.models import Student
from alerts.models import Alert
from interventions.models import InterventionCase
from risk.models import StudentRiskProfile
from attendance.models import AttendanceRecord
from academics.models import TeachingAssignment


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
    total_students = Student.objects.filter(is_active=True).count()

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
    today = timezone.now().date()

    teacher_subjects = list(TeachingAssignment.objects.filter(
        teacher=user
    ).values_list("subject_id", flat=True))

    # If no subjects assigned, return empty data
    if not teacher_subjects:
        return {
            "role": "teacher",
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
        }

    absent_today = AttendanceRecord.objects.filter(
        session__attendance_date=today,
        session__subject_id__in=teacher_subjects,
        status="absent"
    ).count()

    current_absent, previous_absent = get_monthly_counts(
        AttendanceRecord, "session__attendance_date",
        {"session__subject_id__in": teacher_subjects, "status": "absent"}
    )

    absent_change_percent = calculate_percentage_change(current_absent, previous_absent)

    monthly_absence_trend = get_monthly_trend(
        AttendanceRecord, "session__attendance_date",
        {"session__subject_id__in": teacher_subjects, "status": "absent"}
    )

    active_alerts = Alert.objects.filter(
        subject_id__in=teacher_subjects,
        status__in=["active", "under_review", "escalated"]
    ).count()

    current_alerts, previous_alerts = get_monthly_counts(
        Alert, "alert_date",
        {
            "subject_id__in": teacher_subjects,
            "status__in": ["active", "under_review", "escalated"]
        }
    )

    alert_change_percent = calculate_percentage_change(current_alerts, previous_alerts)

    monthly_alert_trend = get_monthly_trend(
        Alert, "alert_date",
        {
            "subject_id__in": teacher_subjects,
            "status__in": ["active", "under_review", "escalated"]
        }
    )

    high_risk_students = list(
        StudentRiskProfile.objects
        .filter(
            risk_level__in=["high", "critical"],
            student__attendance_records__session__subject_id__in=teacher_subjects
        )
        .values("student__full_name", "risk_level", "risk_score")
        .distinct()
    )

    # NEW: Urgent Alerts (Top 5)
    urgent_alerts = list(
        Alert.objects
        .filter(
            subject_id__in=teacher_subjects,
            status__in=["active", "escalated"]
        )
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

    # NEW: My Classes
    my_classes = list(
        TeachingAssignment.objects
        .filter(teacher=user)
        .select_related("classroom", "subject")
        .values(
            "assignment_id",
            "classroom__name",
            "classroom__class_id",
            "subject__name",
            "subject__subject_id"
        )
    )

    return {
        "role": "teacher",
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
    }
