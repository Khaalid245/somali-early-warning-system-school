"""
AI Recommendation Engine
Factor-driven rule-based system — each recommendation is triggered by a
specific signal in the data, not just the final score band.
Standard: Day-based counting (UK/international school standard)
"""
from datetime import date, timedelta
from django.db.models import Count, Q


def calculate_student_risk_score(student):
    """
    Calculate risk score (0-100) based on attendance patterns.
    UK standard: counts distinct DAYS, not sessions.
    Half-day: absent in morning but present in afternoon (or vice versa) = 0.5.
    """
    try:
        from attendance.models import AttendanceRecord
        from attendance.attendance_utils import compute_attendance_days

        totals = compute_attendance_days(student)
        total_days = totals['total_days']

        if total_days == 0:
            return {
                'risk_score': 0,
                'risk_level': 'unknown',
                'confidence': 0,
                'factors': ['No attendance data available']
            }

        absent_days = totals['absent_days']
        present_days = totals['present_days']
        late_days = totals['late_days']
        attendance_rate = totals['attendance_rate']
        consecutive_days = totals['consecutive_absent_days']

        two_weeks_ago = date.today() - timedelta(days=14)
        recent_qs = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date__gte=two_weeks_ago
        )
        recent_totals = compute_attendance_days(student, records_qs=recent_qs)
        recent_absent_dates = recent_totals['absent_days']

        risk_score = 0
        factors = []

        # Factor 1: Attendance rate (40 points)
        if attendance_rate < 75:
            risk_score += 40
            factors.append(f'Critical attendance: {attendance_rate:.1f}% (below 75%)')
        elif attendance_rate < 80:
            risk_score += 30
            factors.append(f'Low attendance: {attendance_rate:.1f}% (below 80%)')
        elif attendance_rate < 90:
            risk_score += 15
            factors.append(f'Below standard: {attendance_rate:.1f}% (persistent absentee threshold: 90%)')

        # Factor 2: Consecutive absent days (30 points)
        if consecutive_days >= 5:
            risk_score += 30
            factors.append(f'{consecutive_days} consecutive absent days - urgent')
        elif consecutive_days >= 3:
            risk_score += 20
            factors.append(f'{consecutive_days} consecutive absent days - alert threshold reached')
        elif consecutive_days >= 1:
            risk_score += 5

        # Factor 3: Recent absent days in last 2 weeks (20 points)
        if recent_absent_dates >= 5:
            risk_score += 20
            factors.append(f'{recent_absent_dates} absent days in last 2 weeks')
        elif recent_absent_dates >= 3:
            risk_score += 12
            factors.append(f'{recent_absent_dates} absent days in last 2 weeks')
        elif recent_absent_dates >= 1:
            risk_score += 5

        # Factor 4: Total absent days this term (10 points)
        if absent_days >= 15:
            risk_score += 10
            factors.append(f'{int(absent_days)} total absent days - intervention required')
        elif absent_days >= 10:
            risk_score += 7
            factors.append(f'{int(absent_days)} total absent days - approaching intervention threshold')
        elif absent_days >= 5:
            risk_score += 3

        # Factor 5: Late days
        if late_days >= 10:
            risk_score += 5
            factors.append(f'{late_days} late arrivals')
        elif late_days >= 5:
            risk_score += 3

        risk_score = min(risk_score, 100)

        if risk_score >= 75:
            risk_level = 'critical'
        elif risk_score >= 50:
            risk_level = 'high'
        elif risk_score >= 25:
            risk_level = 'moderate'
        else:
            risk_level = 'low'

        confidence = min(100, int((total_days / 20) * 100))

        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'confidence': confidence,
            'factors': factors,
            'attendance_rate': round(attendance_rate, 1),
            'total_days': total_days,
            'absent_days': absent_days,
            'consecutive_days': consecutive_days,
            'recent_absent_days': recent_absent_dates,
            'late_days': late_days,
            # backward compat
            'absent_count': absent_days,
            'recent_absences': recent_absent_dates,
        }

    except Exception as e:
        return {
            'risk_score': 0,
            'risk_level': 'error',
            'confidence': 0,
            'factors': [f'Error calculating risk: {str(e)}']
        }


def generate_recommendations(student, risk_data):
    """
    Factor-driven recommendations. Each recommendation is triggered by a
    specific signal in the data, not just the final score band.
    Two students with the same score but different patterns get different advice.
    """
    recommendations = []
    risk_score = risk_data.get('risk_score', 0)
    attendance_rate = risk_data.get('attendance_rate', 100)
    consecutive_days = risk_data.get('consecutive_days', 0)
    recent_absent_days = risk_data.get('recent_absent_days', 0)
    absent_days = risk_data.get('absent_days', 0)
    late_days = risk_data.get('late_days', 0)

    try:
        from interventions.models import InterventionCase
        from attendance.models import AttendanceRecord

        all_cases = list(
            InterventionCase.objects.filter(student=student)
            .order_by('created_at')
            .values('case_id', 'status', 'progress_status', 'created_at',
                    'attendance_rate_at_open', 'attendance_rate_at_close')
        )
        prior_interventions = len(all_cases)
        closed_cases = [c for c in all_cases if c['status'] == 'closed']
        resolved_then_relapsed = (
            len(closed_cases) >= 1 and risk_score >= 40
        )
        revolving_door = (
            len(closed_cases) >= 2 and risk_score >= 40
        )

        # Check for recurring consecutive-absence episodes in past 3 months
        # Must group by DATE first (UK day standard) — multiple sessions per day must not be double-counted
        from attendance.attendance_utils import classify_day
        from collections import defaultdict
        three_months_ago = date.today() - timedelta(days=90)
        cutoff = date.today() - timedelta(days=14)
        hist_qs = (
            AttendanceRecord.objects
            .filter(
                student=student,
                session__attendance_date__gte=three_months_ago,
                session__attendance_date__lt=cutoff,
            )
            .select_related('session')
        )
        # Group records by date
        by_date = defaultdict(list)
        for r in hist_qs:
            by_date[r.session.attendance_date].append(r)
        # Walk dates in order, count episodes of 3+ consecutive full-absent days
        past_episodes = 0
        streak = 0
        for d in sorted(by_date.keys()):
            day_result = classify_day(by_date[d])
            if day_result['absent'] == 1.0:
                streak += 1
                if streak == 3:   # exactly at 3 — count one episode per run
                    past_episodes += 1
            else:
                streak = 0
        recurring_absence_pattern = past_episodes >= 1 and consecutive_days >= 3

    except Exception:
        prior_interventions = 0
        closed_cases = []
        resolved_then_relapsed = False
        revolving_door = False
        recurring_absence_pattern = False

    # --- Factor 1: Consecutive absences (crisis signal) ---
    if consecutive_days >= 5:
        recommendations.append({
            'priority': 'URGENT',
            'icon': 'alert',
            'action': f'Immediate welfare check - {consecutive_days} consecutive days absent',
            'reason': (
                'Extended consecutive absence suggests a crisis at home, not school avoidance. '
                'Standard intervention protocols are insufficient at this stage.'
            ),
            'steps': [
                'Call parent/guardian today - do not wait for a meeting',
                'If no response within 24h, escalate to admin for home visit',
                'Check with other teachers if student has been seen recently',
                'Document all contact attempts'
            ]
        })
    elif consecutive_days >= 3:
        recommendations.append({
            'priority': 'HIGH',
            'icon': 'phone',
            'action': f'Contact parent within 24 hours - {consecutive_days} consecutive days absent',
            'reason': (
                '3 consecutive days is the standard first-alert threshold. '
                'Early contact at this point has the highest success rate in preventing further absence.'
            ),
            'steps': [
                'Phone call first - faster than email',
                'Ask open questions, avoid accusatory tone',
                'Agree a return date and support plan'
            ]
        })

    # --- Factor 2: Subject-specific pattern ---
    try:
        from attendance.models import AttendanceRecord
        subject_absences = (
            AttendanceRecord.objects
            .filter(student=student, status='absent')
            .values('session__subject__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        if subject_absences.exists():
            top = subject_absences.first()
            top_count = top['count']
            top_subject = top['session__subject__name']
            total_absence_sessions = sum(s['count'] for s in subject_absences)
            if total_absence_sessions > 0 and (top_count / total_absence_sessions) > 0.5 and top_count >= 3:
                recommendations.append({
                    'priority': 'HIGH',
                    'icon': 'book',
                    'action': f'Investigate {top_subject} - {top_count} absences concentrated in this subject',
                    'reason': (
                        'When absences concentrate in one subject, the cause is usually '
                        'subject-specific: difficulty, conflict, or peer issues in that class. '
                        'A general attendance intervention will not resolve this.'
                    ),
                    'steps': [
                        f'Meet with the {top_subject} teacher privately',
                        'Ask the student directly about their experience in that class',
                        'Check if seating, grouping, or assessment anxiety is a factor'
                    ]
                })
    except Exception:
        pass

    # --- Factor 3: Sudden recent drop against good history ---
    if recent_absent_days >= 3 and attendance_rate >= 80:
        recommendations.append({
            'priority': 'HIGH',
            'icon': 'trend-down',
            'action': f'Investigate recent trigger - {recent_absent_days} absences in last 2 weeks despite good history',
            'reason': (
                f'Overall rate is {attendance_rate:.0f}% but {recent_absent_days} absences in the last '
                '2 weeks suggests a recent event, not a chronic pattern. '
                'Early action here prevents it becoming chronic.'
            ),
            'steps': [
                'Have an informal 1-on-1 conversation with the student',
                'Ask about friendships, home life, and how they are feeling',
                'Check for recent incidents in pastoral or bullying logs'
            ]
        })

    # --- Factor 4: Chronic overall attendance ---
    if attendance_rate < 75:
        recommendations.append({
            'priority': 'URGENT',
            'icon': 'chart',
            'action': f'Formal attendance improvement plan required - {attendance_rate:.0f}% attendance',
            'reason': (
                'Below 75% means the student is missing more than 1 in 4 school days. '
                'Academic recovery without addressing attendance first is not possible.'
            ),
            'steps': [
                'Schedule formal meeting with parent, student, and form master',
                'Set a written attendance target (minimum 90%) with weekly review',
                'Identify and remove specific barriers: transport, uniform, anxiety',
                'Consider referral to school counselor or external support'
            ]
        })
    elif attendance_rate < 90:
        recommendations.append({
            'priority': 'MODERATE',
            'icon': 'chart',
            'action': f'Attendance improvement plan - {attendance_rate:.0f}% (persistent absentee threshold: 90%)',
            'reason': (
                'Below 90% is the standard persistent absentee threshold (UK DfE). '
                'Without intervention, this rate typically worsens over the term.'
            ),
            'steps': [
                'Bi-weekly check-ins with form master',
                'Set a short-term target: improve by 5% in the next 3 weeks',
                'Positive reinforcement for attendance streaks'
            ]
        })

    # --- Factor 5: Lateness pattern ---
    if late_days >= 5:
        recommendations.append({
            'priority': 'MODERATE',
            'icon': 'clock',
            'action': f'Address lateness pattern - {late_days} late arrivals recorded',
            'reason': (
                'Persistent lateness has different causes from absence '
                '(transport, home routine, anxiety about entering class late) '
                'and sets a pattern that escalates to full absence if unaddressed.'
            ),
            'steps': [
                'Ask student and parent about the morning routine',
                'Check if lateness is always the same period (transport) or random (anxiety)',
                'Consider a soft-start arrangement if anxiety is the cause'
            ]
        })

    # --- Factor 6a: Recurring pattern — same issue returning after a quiet period ---
    if recurring_absence_pattern:
        recommendations.append({
            'priority': 'HIGH',
            'icon': 'repeat',
            'action': f'Recurring absence pattern detected — {past_episodes} previous episode(s) in last 3 months',
            'reason': (
                'This student has had at least one previous run of 3+ consecutive absences '
                'in the last 3 months and is now showing the same pattern again. '
                'This is not a one-off — there is an underlying recurring trigger.'
            ),
            'steps': [
                'Review notes from the previous episode — was a root cause identified?',
                'Ask the student if the same situation is happening again',
                'Look for a pattern: same day of week, same subject, same time of term',
                'Address the root cause, not just the symptom'
            ]
        })

    # --- Factor 6b: Resolved then relapsed — intervention worked but did not hold ---
    if resolved_then_relapsed and not revolving_door:
        last_closed = closed_cases[-1]
        rate_at_open = last_closed.get('attendance_rate_at_open')
        rate_at_close = last_closed.get('attendance_rate_at_close')
        improvement_note = (
            f'Rate improved from {float(rate_at_open):.0f}% to {float(rate_at_close):.0f}% '
            'during the last case, but has since declined again.'
            if rate_at_open and rate_at_close else
            'Student showed improvement during the last intervention case but has since declined.'
        )
        recommendations.append({
            'priority': 'HIGH',
            'icon': 'trend-down',
            'action': f'Previous intervention succeeded but student has relapsed — {len(closed_cases)} closed case(s) on record',
            'reason': (
                f'{improvement_note} '
                'Short-term interventions are working but the underlying issue is not fully resolved.'
            ),
            'steps': [
                'Review what worked in the previous intervention and build on it',
                'Identify what changed after the case was closed — was support withdrawn too early?',
                'Consider a longer monitoring period before closing the next case',
                'Involve the student in setting their own attendance goal'
            ]
        })

    # --- Factor 6c: Revolving door — multiple cycles of improve then relapse ---
    if revolving_door:
        recommendations.append({
            'priority': 'URGENT',
            'icon': 'alert',
            'action': f'Revolving door pattern — {len(closed_cases)} closed cases, student keeps returning to risk',
            'reason': (
                f'This student has been through {len(closed_cases)} intervention cycles. '
                'Each time the case was closed, the problem returned. '
                'Standard school-level intervention is not resolving the root cause.'
            ),
            'steps': [
                'Escalate to admin immediately — this requires a multi-agency approach',
                'Request an external referral: educational psychologist, family support, or social services',
                'Do not close the next case until 6+ weeks of sustained improvement',
                'Review all previous case notes to identify the unresolved root cause'
            ]
        })

    # --- Factor 7: Many open/active cases with no resolution (not covered by revolving door) ---
    # Only fires if revolving_door did NOT already fire (avoids duplicate escalation message)
    if not revolving_door and prior_interventions >= 3 and risk_score >= 50:
        recommendations.append({
            'priority': 'URGENT',
            'icon': 'repeat',
            'action': f'Standard interventions not working - {prior_interventions} cases opened, none resolving',
            'reason': (
                f'This student has had {prior_interventions} intervention cases opened '
                'but the risk score remains high. '
                'Repeating the same approach will not produce different results.'
            ),
            'steps': [
                'Escalate to admin - this case needs a different strategy',
                'Consider external referral: educational psychologist or family support worker',
                'Review all previous intervention notes to identify what was tried and failed'
            ]
        })

    # --- Fallback: no specific concerns ---
    if not recommendations:
        recommendations.append({
            'priority': 'LOW',
            'icon': 'check',
            'action': 'No immediate action required',
            'reason': f'Attendance rate is {attendance_rate:.0f}% with no concerning patterns detected.',
            'steps': [
                'Continue routine monitoring',
                'Acknowledge good attendance to the student'
            ]
        })

    return recommendations


def get_ai_insights_for_student(student):
    """
    Main function: Get complete AI analysis for a student
    """
    risk_data = calculate_student_risk_score(student)
    recommendations = generate_recommendations(student, risk_data)

    return {
        'student_id': student.student_id,
        'student_name': student.full_name,
        'risk_analysis': risk_data,
        'recommendations': recommendations,
        'generated_at': date.today().isoformat()
    }


def get_classroom_ai_summary(students):
    """
    Get AI summary for entire classroom
    """
    if not students:
        return {
            'total_students': 0,
            'risk_distribution': {'critical': 0, 'high': 0, 'moderate': 0, 'low': 0},
            'priority_students': [],
            'health_score': 0,
        }

    risk_distribution = {'critical': 0, 'high': 0, 'moderate': 0, 'low': 0}
    priority_students = []

    for student in students:
        risk_data = calculate_student_risk_score(student)
        risk_level = risk_data['risk_level']

        if risk_level in risk_distribution:
            risk_distribution[risk_level] += 1

        if risk_data['risk_score'] >= 50:
            priority_students.append({
                'student_id': student.student_id,
                'student_name': student.full_name,
                'risk_score': risk_data['risk_score'],
                'risk_level': risk_level,
                'attendance_rate': risk_data.get('attendance_rate', 0)
            })

    priority_students.sort(key=lambda x: x['risk_score'], reverse=True)

    return {
        'total_students': len(students),
        'risk_distribution': risk_distribution,
        'priority_students': priority_students[:10],
        'health_score': calculate_classroom_health(risk_distribution, len(students))
    }


def calculate_classroom_health(risk_distribution, total_students):
    """
    Calculate overall classroom health score (0-100)
    """
    if total_students == 0:
        return 0

    health_score = 100
    health_score -= (risk_distribution.get('critical', 0) / total_students) * 40
    health_score -= (risk_distribution.get('high', 0) / total_students) * 25
    health_score -= (risk_distribution.get('moderate', 0) / total_students) * 10

    return max(0, int(health_score))
