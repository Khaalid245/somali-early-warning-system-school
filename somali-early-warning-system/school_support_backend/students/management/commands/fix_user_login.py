"""
List all users and reset password
Run: python manage.py fix_user_login
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'List users and reset password'

    def handle(self, *args, **options):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('ALL USERS IN DATABASE')
        self.stdout.write('='*60 + '\n')
        
        users = User.objects.all()
        
        if not users:
            self.stdout.write(self.style.ERROR('No users found!'))
            return
        
        for user in users:
            self.stdout.write(f'ID: {user.id}')
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'Name: {user.name}')
            self.stdout.write(f'Role: {user.role}')
            self.stdout.write(f'Active: {user.is_active}')
            self.stdout.write('-' * 40)
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('RESET PASSWORD')
        self.stdout.write('='*60 + '\n')
        
        email = input('Enter email to reset password: ').strip()
        
        try:
            user = User.objects.get(email=email)
            new_password = input('Enter new password: ').strip()
            
            user.set_password(new_password)
            user.save()
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ Password reset for {user.email}'))
            self.stdout.write(self.style.SUCCESS(f'Email: {user.email}'))
            self.stdout.write(self.style.SUCCESS(f'Password: {new_password}'))
            self.stdout.write(self.style.SUCCESS('\nYou can now login!'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'\n✗ User with email {email} not found!'))
