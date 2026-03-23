"""
Management command: send daily attendance reminders to teachers.

Run manually:
    python manage.py send_attendance_reminders

Schedule via cron (runs at 11:00 AM every school day):
    0 11 * * 1-5 /path/to/venv/bin/python /path/to/manage.py send_attendance_reminders

What it does:
  1. Gets all active teaching assignments for today.
  2. Checks which ones have NO attendance session recorded yet today.
  3. Groups missing assignments by teacher.
  4. Sends one reminder email per teacher listing all their missing classes.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q

from academics.models import TeachingAssignment
from attendance.models import AttendanceSession
from notifications.email_service import send_attendance_reminder_to_teacher
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send attendance reminder emails to teachers who have not recorded attendance today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would be sent without actually sending emails',
        )
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Target date in YYYY-MM-DD format (defaults to today)',
        )

    def handle(self, *args, **options):
        from datetime import date

        dry_run = options['dry_run']
        target_date_str = options.get('date')

        if target_date_str:
            try:
                from datetime import datetime
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(self.style.ERROR(f'Invalid date format: {target_date_str}. Use YYYY-MM-DD'))
                return
        else:
            target_date = date.today()

        # Skip weekends
        if target_date.weekday() >= 5:
            self.stdout.write(self.style.WARNING(f'{target_date} is a weekend. No reminders sent.'))
            return

        self.stdout.write(f'Checking attendance for: {target_date}')

        # All active teaching assignments
        all_assignments = TeachingAssignment.objects.filter(
            is_active=True
        ).select_related('teacher', 'subject', 'classroom')

        if not all_assignments.exists():
            self.stdout.write(self.style.WARNING('No active teaching assignments found.'))
            return

        # Sessions already recorded today
        recorded_sessions = set(
            AttendanceSession.objects.filter(
                attendance_date=target_date
            ).values_list('classroom_id', 'subject_id', 'teacher_id')
        )

        # Group missing assignments by teacher
        missing_by_teacher = {}
        for assignment in all_assignments:
            key = (assignment.classroom_id, assignment.subject_id, assignment.teacher_id)
            if key not in recorded_sessions:
                teacher = assignment.teacher
                if teacher.id not in missing_by_teacher:
                    missing_by_teacher[teacher.id] = {
                        'teacher': teacher,
                        'assignments': []
                    }
                missing_by_teacher[teacher.id]['assignments'].append({
                    'classroom_name': assignment.classroom.name,
                    'subject_name': assignment.subject.name,
                    'period': '—',  # Period is chosen at submission time, not pre-assigned
                })

        if not missing_by_teacher:
            self.stdout.write(self.style.SUCCESS(
                f'All attendance recorded for {target_date}. No reminders needed.'
            ))
            return

        self.stdout.write(f'Found {len(missing_by_teacher)} teacher(s) with missing attendance:')

        sent = 0
        failed = 0

        for teacher_id, data in missing_by_teacher.items():
            teacher = data['teacher']
            assignments = data['assignments']

            self.stdout.write(
                f'  - {teacher.name} ({teacher.email}): '
                f'{len(assignments)} missing assignment(s)'
            )
            for a in assignments:
                self.stdout.write(f'      {a["classroom_name"]} — {a["subject_name"]}')

            if dry_run:
                self.stdout.write(self.style.WARNING('    [DRY RUN] Email not sent'))
                continue

            try:
                send_attendance_reminder_to_teacher(teacher, assignments)
                self.stdout.write(self.style.SUCCESS(f'    Reminder sent to {teacher.email}'))
                sent += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'    Failed: {e}'))
                failed += 1

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'\nDone. Sent: {sent}, Failed: {failed}'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'\n[DRY RUN] Would have sent {len(missing_by_teacher)} reminder(s).'
            ))
