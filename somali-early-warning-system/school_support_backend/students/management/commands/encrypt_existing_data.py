"""
Management command to encrypt existing data in the database
Run: python manage.py encrypt_existing_data
"""
from django.core.management.base import BaseCommand
from django.db import connection
from students.models import Student
from users.models import User
from core.encryption import encrypt_data


class Command(BaseCommand):
    help = 'Encrypt existing unencrypted data in the database'

    def handle(self, *args, **options):
        self.stdout.write('Starting data encryption...')
        
        # Encrypt Student data
        students = Student.objects.all()
        student_count = 0
        for student in students:
            # Re-save to trigger encryption
            student.save()
            student_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Encrypted {student_count} students'))
        
        # Encrypt User data
        users = User.objects.all()
        user_count = 0
        for user in users:
            # Re-save to trigger encryption
            user.save()
            user_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Encrypted {user_count} users'))
        
        self.stdout.write(self.style.SUCCESS('✓ Data encryption completed successfully!'))
