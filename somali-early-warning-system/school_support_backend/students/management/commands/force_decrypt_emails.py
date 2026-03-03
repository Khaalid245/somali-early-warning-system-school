"""
Force decrypt all emails in database
Run: python manage.py force_decrypt_emails
"""
from django.core.management.base import BaseCommand
from django.db import connection
from core.encryption import decrypt_data


class Command(BaseCommand):
    help = 'Force decrypt all encrypted emails'

    def handle(self, *args, **options):
        self.stdout.write('Force decrypting emails...\n')
        
        with connection.cursor() as cursor:
            # Get all users
            cursor.execute("SELECT id, email FROM users_user")
            users = cursor.fetchall()
            
            for user_id, encrypted_email in users:
                try:
                    # Try to decrypt
                    decrypted_email = decrypt_data(encrypted_email)
                    
                    # Update directly
                    cursor.execute(
                        "UPDATE users_user SET email = %s WHERE id = %s",
                        [decrypted_email, user_id]
                    )
                    
                    self.stdout.write(self.style.SUCCESS(f'✓ User {user_id}: {decrypted_email}'))
                    
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ User {user_id}: Already plaintext or error'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ Done! Run fix_user_login again to see emails.'))
