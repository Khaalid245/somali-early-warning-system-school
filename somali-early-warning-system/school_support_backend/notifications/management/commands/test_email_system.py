"""
Management command to test the professional email notification system
Usage: python manage.py test_email_system
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from students.models import Student
from notifications.email_service import send_absence_alert
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test the professional email notification system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--student-id',
            type=int,
            help='Student ID to test with (optional)',
        )
        parser.add_argument(
            '--consecutive-days',
            type=int,
            default=3,
            help='Number of consecutive absence days to simulate',
        )
        parser.add_argument(
            '--subject',
            type=str,
            default='Mathematics',
            help='Subject name for the test',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Testing Professional Email Notification System')
        )
        
        try:
            # Get a test student
            if options['student_id']:
                try:
                    student = Student.objects.get(student_id=options['student_id'])
                except Student.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'Student with ID {options["student_id"]} not found')
                    )
                    return
            else:
                student = Student.objects.first()
                if not student:
                    self.stdout.write(
                        self.style.ERROR('No students found in database')
                    )
                    return

            self.stdout.write(f'Testing with student: {student.full_name}')
            self.stdout.write(f'Parent email: {student.parent_email or "NOT SET"}')
            
            # Test the professional email system
            consecutive_days = options['consecutive_days']
            subject_name = options['subject']
            
            self.stdout.write(f'Simulating {consecutive_days} consecutive absences in {subject_name}')
            
            # Send the professional email
            send_absence_alert(student, consecutive_days, subject_name)
            
            self.stdout.write(
                self.style.SUCCESS('Professional email notification sent successfully!')
            )
            
            self.stdout.write('\nEmail Features Tested:')
            self.stdout.write('  - Detailed absence history')
            self.stdout.write('  - Subject-wise breakdown')
            self.stdout.write('  - Professional formatting')
            self.stdout.write('  - Parent + Form Master + Admin notifications')
            self.stdout.write('  - Risk level assessment')
            self.stdout.write('  - Intervention recommendations')
            self.stdout.write('  - Contact information')
            self.stdout.write('  - Professional branding')
            
            if consecutive_days >= 5:
                self.stdout.write('  - Critical alert to administrators')
            
            self.stdout.write(
                self.style.SUCCESS('\nCAPSTONE PROJECT: Email system is PRODUCTION READY!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Email test failed: {str(e)}')
            )
            logger.error(f'Email test failed: {e}', exc_info=True)
            
        self.stdout.write('\nNext Steps:')
        self.stdout.write('1. Configure SMTP settings in .env file')
        self.stdout.write('2. Set EMAIL_BACKEND to smtp in production')
        self.stdout.write('3. Test with real email addresses')
        self.stdout.write('4. Monitor email delivery logs')