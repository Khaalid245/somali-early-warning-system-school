"""
Professional School Timetable Generator
Implements intelligent scheduling with educational best practices
"""
from django.db import transaction
from academics.models import Subject, TeachingAssignment
from academics.schedule_models import SchoolTimetable
from students.models import Classroom
from users.models import User
import random


class TimetableGenerator:
    """
    Intelligent timetable generator following educational best practices
    """
    
    DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    PERIODS = ['1', '2', '3', '4', '5', '6']
    
    # Morning periods (better for difficult subjects)
    MORNING_PERIODS = ['1', '2', '3']
    # Post-lunch periods
    AFTERNOON_PERIODS = ['4', '5', '6']
    
    def __init__(self, classroom, academic_year='2024-2025', term='Term 1', created_by=None):
        self.classroom = classroom
        self.academic_year = academic_year
        self.term = term
        self.created_by = created_by
        self.schedule = {}  # {day: {period: subject}}
        self.subject_count = {}  # Track how many times each subject is scheduled
        self.errors = []
        
    def generate(self):
        """
        Main generation method
        Returns: (success: bool, schedule: dict, errors: list)
        """
        try:
            # Step 1: Get available subjects and teachers
            assignments = self._get_teaching_assignments()
            if not assignments:
                self.errors.append("No teaching assignments found for this classroom")
                return False, None, self.errors
            
            # Step 2: Initialize schedule structure
            self._initialize_schedule()
            
            # Step 3: Calculate subject distribution
            subject_distribution = self._calculate_subject_distribution(assignments)
            
            # Step 4: Schedule subjects intelligently
            success = self._schedule_subjects(assignments, subject_distribution)
            
            if not success:
                return False, None, self.errors
            
            # Step 5: Validate schedule
            if not self._validate_schedule():
                return False, None, self.errors
            
            return True, self.schedule, []
            
        except Exception as e:
            self.errors.append(f"Generation failed: {str(e)}")
            return False, None, self.errors
    
    def _get_teaching_assignments(self):
        """Get all active teaching assignments for this classroom"""
        return TeachingAssignment.objects.filter(
            classroom=self.classroom,
            is_active=True
        ).select_related('teacher', 'subject')
    
    def _initialize_schedule(self):
        """Create empty schedule structure"""
        for day in self.DAYS:
            self.schedule[day] = {}
            for period in self.PERIODS:
                self.schedule[day][period] = None
    
    def _calculate_subject_distribution(self, assignments):
        """
        Calculate how many periods each subject should get per week
        Based on subject priority (1=5 periods, 2=4 periods, etc.)
        """
        distribution = {}
        total_slots = len(self.DAYS) * len(self.PERIODS)  # 6 days × 6 periods = 36 slots
        
        for assignment in assignments:
            subject = assignment.subject
            # Get recommended periods based on priority
            recommended_periods = subject.get_weekly_periods()
            distribution[assignment] = min(recommended_periods, total_slots)
        
        return distribution
    
    def _schedule_subjects(self, assignments, distribution):
        """
        Intelligently schedule subjects following educational best practices
        """
        # Sort assignments by priority (core subjects first)
        sorted_assignments = sorted(
            assignments,
            key=lambda a: (a.subject.priority, a.subject.difficulty == 'difficult'),
            reverse=False
        )
        
        # Track scheduled count for each subject
        scheduled_count = {assignment: 0 for assignment in sorted_assignments}
        
        # Schedule difficult subjects in morning periods first
        for assignment in sorted_assignments:
            if assignment.subject.difficulty == 'difficult':
                target_periods = distribution[assignment]
                for _ in range(target_periods):
                    if not self._schedule_subject_intelligently(assignment, prefer_morning=True):
                        break
                    scheduled_count[assignment] += 1
        
        # Schedule remaining subjects
        for assignment in sorted_assignments:
            target_periods = distribution[assignment]
            remaining = target_periods - scheduled_count[assignment]
            
            for _ in range(remaining):
                if not self._schedule_subject_intelligently(assignment, prefer_morning=False):
                    break
                scheduled_count[assignment] += 1
        
        # Check if we scheduled enough
        total_scheduled = sum(scheduled_count.values())
        if total_scheduled < len(self.DAYS) * len(self.PERIODS) * 0.8:  # At least 80% filled
            self.errors.append(f"Only scheduled {total_scheduled} out of {len(self.DAYS) * len(self.PERIODS)} slots")
            return False
        
        return True
    
    def _schedule_subject_intelligently(self, assignment, prefer_morning=False):
        """
        Find best slot for a subject following constraints
        """
        subject = assignment.subject
        teacher = assignment.teacher
        
        # Build list of candidate slots
        candidates = []
        
        for day in self.DAYS:
            # Check if subject already scheduled today (avoid repetition)
            if self._is_subject_scheduled_today(subject, day):
                continue
            
            for period in self.PERIODS:
                # Skip if slot already filled
                if self.schedule[day][period] is not None:
                    continue
                
                # Check constraints
                if not self._can_schedule_here(assignment, day, period):
                    continue
                
                # Calculate score for this slot
                score = self._calculate_slot_score(assignment, day, period, prefer_morning)
                candidates.append((day, period, score))
        
        if not candidates:
            return False
        
        # Sort by score (higher is better) and pick best slot
        candidates.sort(key=lambda x: x[2], reverse=True)
        best_day, best_period, _ = candidates[0]
        
        # Schedule it
        self.schedule[best_day][best_period] = {
            'assignment': assignment,
            'subject': subject,
            'teacher': teacher
        }
        
        return True
    
    def _is_subject_scheduled_today(self, subject, day):
        """Check if subject is already scheduled on this day"""
        for period in self.PERIODS:
            slot = self.schedule[day][period]
            if slot and slot['subject'] == subject:
                return True
        return False
    
    def _can_schedule_here(self, assignment, day, period):
        """Check if subject can be scheduled in this slot"""
        subject = assignment.subject
        teacher = assignment.teacher
        
        # Constraint 1: Physical Education and Art not in first period
        if period == '1' and not subject.can_be_first_period:
            return False
        
        # Constraint 2: Check if teacher is available (not teaching elsewhere)
        if self._is_teacher_busy(teacher, day, period):
            return False
        
        # Constraint 3: Avoid too many difficult subjects consecutively
        if subject.difficulty == 'difficult':
            if self._has_consecutive_difficult(day, period):
                return False
        
        return True
    
    def _is_teacher_busy(self, teacher, day, period):
        """Check if teacher is already scheduled at this time"""
        # Check in current schedule
        for d in self.DAYS:
            slot = self.schedule[d].get(period)
            if slot and slot['teacher'] == teacher and d == day:
                return True
        
        # Check in existing database timetable
        existing = SchoolTimetable.objects.filter(
            teacher=teacher,
            day_of_week=day,
            period=period,
            is_active=True
        ).exclude(classroom=self.classroom).exists()
        
        return existing
    
    def _has_consecutive_difficult(self, day, period):
        """Check if there are already 2 consecutive difficult subjects"""
        period_num = int(period)
        
        # Check previous period
        if period_num > 1:
            prev_period = str(period_num - 1)
            prev_slot = self.schedule[day].get(prev_period)
            if prev_slot and prev_slot['subject'].difficulty == 'difficult':
                # Check period before that
                if period_num > 2:
                    prev_prev_period = str(period_num - 2)
                    prev_prev_slot = self.schedule[day].get(prev_prev_period)
                    if prev_prev_slot and prev_prev_slot['subject'].difficulty == 'difficult':
                        return True
        
        return False
    
    def _calculate_slot_score(self, assignment, day, period, prefer_morning):
        """
        Calculate score for scheduling a subject in a specific slot
        Higher score = better fit
        """
        score = 100
        subject = assignment.subject
        
        # Prefer morning for difficult subjects
        if prefer_morning and period in self.MORNING_PERIODS:
            score += 50
        
        # Prefer afternoon for easy subjects
        if subject.difficulty == 'easy' and period in self.AFTERNOON_PERIODS:
            score += 30
        
        # Bonus for preferred periods
        if subject.preferred_periods:
            preferred = subject.preferred_periods.split(',')
            if period in preferred:
                score += 40
        
        # Distribute subjects evenly across week
        day_index = self.DAYS.index(day)
        if day_index < 3:  # Early in week
            score += 10
        
        # Avoid scheduling same subject type consecutively
        period_num = int(period)
        if period_num > 1:
            prev_period = str(period_num - 1)
            prev_slot = self.schedule[day].get(prev_period)
            if prev_slot and prev_slot['subject'].subject_type == subject.subject_type:
                score -= 20
        
        return score
    
    def _validate_schedule(self):
        """Validate the generated schedule"""
        # Check: No empty days
        for day in self.DAYS:
            filled_periods = sum(1 for p in self.PERIODS if self.schedule[day][p] is not None)
            if filled_periods == 0:
                self.errors.append(f"No classes scheduled on {day}")
                return False
        
        # Check: Core subjects appear frequently
        core_subjects = {}
        for day in self.DAYS:
            for period in self.PERIODS:
                slot = self.schedule[day][period]
                if slot and slot['subject'].priority <= 2:  # Core subjects
                    subject_name = slot['subject'].name
                    core_subjects[subject_name] = core_subjects.get(subject_name, 0) + 1
        
        for subject_name, count in core_subjects.items():
            if count < 3:
                self.errors.append(f"Core subject '{subject_name}' only scheduled {count} times (minimum 3)")
        
        return len(self.errors) == 0
    
    def save_to_database(self):
        """Save generated schedule to database"""
        if not self.schedule:
            raise ValueError("No schedule to save. Generate first.")
        
        with transaction.atomic():
            # Delete existing schedule for this classroom
            SchoolTimetable.objects.filter(
                classroom=self.classroom,
                academic_year=self.academic_year,
                term=self.term
            ).delete()
            
            # Create new schedule
            created_count = 0
            for day in self.DAYS:
                for period in self.PERIODS:
                    slot = self.schedule[day][period]
                    if slot:
                        SchoolTimetable.objects.create(
                            classroom=self.classroom,
                            subject=slot['subject'],
                            teacher=slot['teacher'],
                            day_of_week=day,
                            period=period,
                            academic_year=self.academic_year,
                            term=self.term,
                            created_by=self.created_by,
                            is_active=True
                        )
                        created_count += 1
            
            return created_count


def generate_timetable_for_classroom(classroom_id, admin_user, academic_year='2024-2025', term='Term 1'):
    """
    Convenience function to generate timetable for a classroom
    """
    try:
        classroom = Classroom.objects.get(class_id=classroom_id)
        generator = TimetableGenerator(classroom, academic_year, term, admin_user)
        
        success, schedule, errors = generator.generate()
        
        if success:
            created_count = generator.save_to_database()
            return {
                'success': True,
                'message': f'Successfully generated timetable with {created_count} periods',
                'schedule': schedule
            }
        else:
            return {
                'success': False,
                'errors': errors
            }
    
    except Classroom.DoesNotExist:
        return {
            'success': False,
            'errors': ['Classroom not found']
        }
    except Exception as e:
        return {
            'success': False,
            'errors': [f'Generation failed: {str(e)}']
        }
