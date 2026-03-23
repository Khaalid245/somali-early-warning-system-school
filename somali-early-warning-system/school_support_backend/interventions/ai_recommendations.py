"""
Simple AI Recommendation Engine
Rule-based system for student risk analysis and intervention recommendations
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

        # --- Recent trend: last 2 weeks (distinct absent days, UK half-day aware) ---
        two_weeks_ago = date.today() - timedelta(days=14)
        recent_qs = AttendanceRecord.objects.filter(
            student=student,
            session__attendance_date__gte=two_weeks_ago
        )
        recent_totals = compute_attendance_days(student, records_qs=recent_qs)
        recent_absent_dates = recent_totals['absent_days']  # float, half-days counted as 0.5

        # =====================================================
        # RISK SCORE — International standard thresholds
        # =====================================================
        risk_score = 0
        factors = []

        # Factor 1: Attendance rate (40 points)
        # Standard: <90% = persistent absentee (UK DfE / US standard)
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
        # Standard: 3 consecutive days = immediate alert
        if consecutive_days >= 5:
            risk_score += 30
            factors.append(f'{consecutive_days} consecutive absent days — urgent')
        elif consecutive_days >= 3:
            risk_score += 20
            factors.append(f'{consecutive_days} consecutive absent days — alert threshold reached')
        elif consecutive_days >= 1:
            risk_score += 5

        # Factor 3: Recent absent days in last 2 weeks (20 points)
        # Standard: 3+ days in 2 weeks = concerning pattern
        if recent_absent_dates >= 5:
            risk_score += 20
            factors.append(f'{recent_absent_dates} absent days in last 2 weeks')
        elif recent_absent_dates >= 3:
            risk_score += 12
            factors.append(f'{recent_absent_dates} absent days in last 2 weeks')
        elif recent_absent_dates >= 1:
            risk_score += 5

        # Factor 4: Total absent days this term (10 points)
        # Standard: 10 days = intervention threshold
        if absent_days >= 15:
            risk_score += 10
            factors.append(f'{int(absent_days)} total absent days — intervention required')
        elif absent_days >= 10:
            risk_score += 7
            factors.append(f'{int(absent_days)} total absent days — approaching intervention threshold')
        elif absent_days >= 5:
            risk_score += 3

        # Factor 5: Late days (bonus points)
        if late_days >= 10:
            risk_score += 5
            factors.append(f'{late_days} late arrivals')
        elif late_days >= 5:
            risk_score += 3

        risk_score = min(risk_score, 100)

        # --- Risk level (international standard thresholds) ---
        if risk_score >= 75:
            risk_level = 'critical'
        elif risk_score >= 50:
            risk_level = 'high'
        elif risk_score >= 25:
            risk_level = 'moderate'
        else:
            risk_level = 'low'

        # Confidence: based on how many school days of data we have
        # 20 school days (~4 weeks) = full confidence
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
    Generate actionable recommendations based on risk score
    """
    recommendations = []
    risk_score = risk_data['risk_score']
    risk_level = risk_data['risk_level']
    attendance_rate = risk_data.get('attendance_rate', 0)
    recent_absences = risk_data.get('recent_absences', 0)
    
    # CRITICAL RISK (75-100)
    if risk_score >= 75:
        recommendations.append({
            'priority': 'URGENT',
            'action': 'Schedule parent meeting within 24 hours',
            'reason': 'Student at immediate risk of academic failure',
            'success_rate': '87%',
            'icon': '🚨',
            'steps': [
                'Contact parent/guardian immediately',
                'Schedule in-person meeting',
                'Develop action plan with family',
                'Assign daily check-ins'
            ]
        })
        
        recommendations.append({
            'priority': 'URGENT',
            'action': 'Assign dedicated counselor support',
            'reason': 'Needs intensive intervention',
            'success_rate': '73%',
            'icon': '👨‍🏫',
            'frequency': 'Daily check-ins for 2 weeks'
        })
    
    # HIGH RISK (50-74)
    elif risk_score >= 50:
        recommendations.append({
            'priority': 'HIGH',
            'action': 'Weekly counseling sessions',
            'reason': 'Chronic attendance issues detected',
            'success_rate': '78%',
            'icon': '📋',
            'duration': '4-6 weeks'
        })
        
        recommendations.append({
            'priority': 'HIGH',
            'action': 'Contact parents for support',
            'reason': 'Family engagement improves outcomes',
            'success_rate': '72%',
            'icon': '📞'
        })
    
    # MODERATE RISK (25-49)
    elif risk_score >= 25:
        recommendations.append({
            'priority': 'MODERATE',
            'action': 'Bi-weekly check-ins',
            'reason': 'Monitor attendance patterns',
            'success_rate': '65%',
            'icon': '📊',
            'frequency': 'Every 2 weeks'
        })
        
        recommendations.append({
            'priority': 'MODERATE',
            'action': 'Peer mentorship program',
            'reason': 'Social support improves attendance',
            'success_rate': '68%',
            'icon': '👥'
        })
    
    # LOW RISK (0-24)
    else:
        recommendations.append({
            'priority': 'LOW',
            'action': 'Continue monitoring',
            'reason': 'Student performing well',
            'success_rate': '95%',
            'icon': '✅',
            'note': 'No immediate action needed'
        })
    
    # Specific recommendations based on patterns
    if recent_absences >= 3:
        recommendations.append({
            'priority': 'HIGH' if risk_score >= 50 else 'MODERATE',
            'action': 'Investigate recent absence pattern',
            'reason': f'{recent_absences} absences in last 2 weeks',
            'icon': '🔍',
            'suggestions': [
                'Check for health issues',
                'Assess family circumstances',
                'Review transportation challenges'
            ]
        })
    
    if attendance_rate < 75:
        recommendations.append({
            'priority': 'HIGH',
            'action': 'Develop attendance improvement plan',
            'reason': f'Attendance rate critically low: {attendance_rate:.1f}%',
            'icon': '📈',
            'target': 'Increase to 85% within 4 weeks'
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
    
    risk_distribution = {
        'critical': 0,
        'high': 0,
        'moderate': 0,
        'low': 0
    }
    
    priority_students = []
    
    for student in students:
        risk_data = calculate_student_risk_score(student)
        risk_level = risk_data['risk_level']
        
        if risk_level in risk_distribution:
            risk_distribution[risk_level] += 1
        
        # Add to priority list if high or critical
        if risk_data['risk_score'] >= 50:
            priority_students.append({
                'student_id': student.student_id,
                'student_name': student.full_name,
                'risk_score': risk_data['risk_score'],
                'risk_level': risk_level,
                'attendance_rate': risk_data.get('attendance_rate', 0)
            })
    
    # Sort priority students by risk score
    priority_students.sort(key=lambda x: x['risk_score'], reverse=True)
    
    return {
        'total_students': len(students),
        'risk_distribution': risk_distribution,
        'priority_students': priority_students[:10],  # Top 10
        'health_score': calculate_classroom_health(risk_distribution, len(students))
    }


def calculate_classroom_health(risk_distribution, total_students):
    """
    Calculate overall classroom health score (0-100)
    """
    if total_students == 0:
        return 0
    
    # Weight different risk levels
    health_score = 100
    health_score -= (risk_distribution.get('critical', 0) / total_students) * 40
    health_score -= (risk_distribution.get('high', 0) / total_students) * 25
    health_score -= (risk_distribution.get('moderate', 0) / total_students) * 10
    
    return max(0, int(health_score))
