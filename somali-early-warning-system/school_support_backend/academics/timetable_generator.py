"""
School Timetable Generator — Somalia Standard (Saturday–Thursday)

Rules:
  - 6 days x 6 periods = 36 slots per classroom per week
  - 10 subjects, each gets 3-4 periods spread across DIFFERENT days
  - Each day has exactly 6 DIFFERENT subjects (one period each)
  - No subject appears twice on the same day
  - Difficult subjects go to morning periods (1,2,3)
  - No teacher conflict across classrooms same day+period
  - Generates ALL classrooms together to guarantee no teacher conflicts
"""
import random
from django.db import transaction
from academics.models import Subject, TeachingAssignment
from academics.schedule_models import SchoolTimetable
from students.models import Classroom

DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
PERIODS = ['1', '2', '3', '4', '5', '6']
MORNING = ['1', '2', '3']
AFTERNOON = ['4', '5', '6']
MAX_RETRIES = 50


class TimetableGenerator:

    def __init__(self, classroom, academic_year='2024-2025', term='Term 1', created_by=None):
        self.classroom = classroom
        self.academic_year = academic_year
        self.term = term
        self.created_by = created_by
        self.errors = []
        self.schedule = {day: {p: None for p in PERIODS} for day in DAYS}

    def generate(self, teacher_day_period_taken=None):
        """
        teacher_day_period_taken: set of (teacher_id, day, period) already committed
        by previously generated classrooms in this same run.
        """
        if teacher_day_period_taken is None:
            teacher_day_period_taken = set()

        assignments = list(
            TeachingAssignment.objects.filter(classroom=self.classroom, is_active=True)
            .select_related('teacher', 'subject')
        )
        if not assignments:
            self.errors.append('No teaching assignments found for this classroom')
            return False, None, self.errors

        subj_teacher = {a.subject: a.teacher for a in assignments}
        subjects = list(subj_teacher.keys())

        for attempt in range(MAX_RETRIES):
            self.schedule = {day: {p: None for p in PERIODS} for day in DAYS}
            self.errors = []

            subject_days = self._assign_subject_days(subjects)
            day_subjects = self._build_day_subjects(subjects, subject_days)
            if day_subjects is None:
                continue

            success = self._assign_periods(day_subjects, subj_teacher, teacher_day_period_taken)
            if success:
                return True, self.schedule, []

        self.errors.append(
            f'Could not generate conflict-free timetable for {self.classroom.name} '
            f'after {MAX_RETRIES} attempts'
        )
        return False, None, self.errors

    def _assign_subject_days(self, subjects):
        n = len(subjects)
        total_slots = len(DAYS) * len(PERIODS)  # 36
        base = total_slots // n
        extra = total_slots % n

        sorted_subjects = sorted(subjects, key=lambda s: s.priority)
        counts = {s: base + (1 if i < extra else 0)
                  for i, s in enumerate(sorted_subjects)}

        subject_days = {s: [] for s in subjects}
        day_load = {d: 0 for d in DAYS}

        for subj in sorted_subjects:
            needed = counts[subj]
            available = sorted(DAYS, key=lambda d: day_load[d])
            random.shuffle(available[:3])
            chosen = []
            for d in available:
                if day_load[d] < len(PERIODS) and d not in chosen:
                    chosen.append(d)
                    day_load[d] += 1
                    if len(chosen) == needed:
                        break
            subject_days[subj] = chosen

        return subject_days

    def _build_day_subjects(self, subjects, subject_days):
        day_subjects = {d: [] for d in DAYS}
        for subj, days in subject_days.items():
            for d in days:
                day_subjects[d].append(subj)

        for day in DAYS:
            if len(day_subjects[day]) != len(PERIODS):
                return None

        for day in DAYS:
            random.shuffle(day_subjects[day])

        return day_subjects

    def _assign_periods(self, day_subjects, subj_teacher, teacher_day_period_taken):
        for day in DAYS:
            subjects_today = day_subjects[day]

            all_sorted = sorted(
                subjects_today,
                key=lambda s: (
                    0 if s.difficulty == 'difficult' else
                    1 if s.difficulty == 'moderate' else 2,
                    s.priority
                )
            )

            preferred = {}
            for i, subj in enumerate(all_sorted):
                preferred[subj] = MORNING if i < 3 else AFTERNOON

            assigned_periods = {}
            used_periods = set()

            # Pass 1: preferred half, no conflict
            for subj in all_sorted:
                teacher = subj_teacher[subj]
                for period in preferred[subj]:
                    if period not in used_periods and \
                       not self._is_taken(teacher, day, period, teacher_day_period_taken):
                        assigned_periods[subj] = period
                        used_periods.add(period)
                        break

            # Pass 2: any free period, no conflict
            for subj in all_sorted:
                if subj in assigned_periods:
                    continue
                teacher = subj_teacher[subj]
                for period in PERIODS:
                    if period not in used_periods and \
                       not self._is_taken(teacher, day, period, teacher_day_period_taken):
                        assigned_periods[subj] = period
                        used_periods.add(period)
                        break

            # If any subject still unassigned, this attempt failed
            if len(assigned_periods) < len(all_sorted):
                return False

            for subj, period in assigned_periods.items():
                self.schedule[day][period] = {
                    'subject': subj,
                    'teacher': subj_teacher[subj]
                }

        return True

    def _is_taken(self, teacher, day, period, teacher_day_period_taken):
        """Check in-memory set (other classrooms this run) only."""
        return (teacher.id, day, period) in teacher_day_period_taken

    def get_teacher_slots(self):
        """Return set of (teacher_id, day, period) for all assigned slots."""
        slots = set()
        for day in DAYS:
            for period in PERIODS:
                slot = self.schedule[day][period]
                if slot:
                    slots.add((slot['teacher'].id, day, period))
        return slots

    def save_to_database(self):
        with transaction.atomic():
            SchoolTimetable.objects.filter(
                classroom=self.classroom,
                academic_year=self.academic_year,
                term=self.term
            ).delete()

            created = 0
            for day in DAYS:
                for period in PERIODS:
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
                        created += 1
            return created


def generate_timetable_for_classroom(classroom_id, admin_user,
                                      academic_year='2024-2025', term='Term 1'):
    """
    Generate timetable for one classroom, coordinating with all other classrooms
    that share teachers to avoid conflicts.
    """
    try:
        classroom = Classroom.objects.get(class_id=classroom_id)

        # Get all OTHER classrooms that share any teacher with this classroom
        my_teacher_ids = set(
            TeachingAssignment.objects.filter(classroom=classroom, is_active=True)
            .values_list('teacher_id', flat=True)
        )
        other_classrooms = list(
            Classroom.objects.exclude(class_id=classroom_id).filter(is_active=True)
        )
        sharing_classrooms = [
            c for c in other_classrooms
            if TeachingAssignment.objects.filter(
                classroom=c, teacher_id__in=my_teacher_ids, is_active=True
            ).exists()
        ]

        # Delete ALL related classrooms' timetables so we regenerate from scratch
        all_classroom_ids = [classroom_id] + [c.class_id for c in sharing_classrooms]
        SchoolTimetable.objects.filter(
            classroom_id__in=all_classroom_ids,
            academic_year=academic_year,
            term=term
        ).delete()

        # Generate all classrooms together, passing committed slots forward
        all_classrooms = [classroom] + sharing_classrooms
        committed_slots = set()
        generators = []

        for cls in all_classrooms:
            gen = TimetableGenerator(cls, academic_year, term, admin_user)
            success, schedule, errors = gen.generate(teacher_day_period_taken=committed_slots)
            if not success:
                return {'success': False, 'errors': errors}
            committed_slots |= gen.get_teacher_slots()
            generators.append(gen)

        # Save all
        total_created = 0
        with transaction.atomic():
            for gen in generators:
                total_created += gen.save_to_database()

        return {
            'success': True,
            'message': f'Generated {total_created} periods across {len(all_classrooms)} classroom(s)'
        }

    except Classroom.DoesNotExist:
        return {'success': False, 'errors': ['Classroom not found']}
    except Exception as e:
        return {'success': False, 'errors': [str(e)]}
