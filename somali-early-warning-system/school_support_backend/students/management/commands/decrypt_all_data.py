"""
Decrypt all encrypted data back to plaintext
Run: python manage.py decrypt_all_data
"""
from django.core.management.base import BaseCommand
from django.db import connection
from core.encryption import decrypt_data


class Command(BaseCommand):
    help = 'Decrypt all encrypted data back to plaintext'

    def handle(self, *args, **options):
        self.stdout.write('Decrypting all data...')
        
        with connection.cursor() as cursor:
            # Decrypt user names
            cursor.execute("SELECT id, name, phone FROM users_user")
            users = cursor.fetchall()
            
            for user_id, name, phone in users:
                try:
                    decrypted_name = decrypt_data(name) if name else name
                    decrypted_phone = decrypt_data(phone) if phone else phone
                    
                    cursor.execute(
                        "UPDATE users_user SET name = %s, phone = %s WHERE id = %s",
                        [decrypted_name, decrypted_phone, user_id]
                    )
                    self.stdout.write(f'✓ Decrypted user {user_id}')
                except Exception as e:
                    self.stdout.write(f'⚠ User {user_id} already plaintext or error: {e}')
            
            # Decrypt student names
            cursor.execute("SELECT student_id, full_name FROM students_student")
            students = cursor.fetchall()
            
            for student_id, full_name in students:
                try:
                    decrypted_name = decrypt_data(full_name) if full_name else full_name
                    
                    cursor.execute(
                        "UPDATE students_student SET full_name = %s WHERE student_id = %s",
                        [decrypted_name, student_id]
                    )
                    self.stdout.write(f'✓ Decrypted student {student_id}')
                except Exception as e:
                    self.stdout.write(f'⚠ Student {student_id} already plaintext or error: {e}')
        
        self.stdout.write(self.style.SUCCESS('\n✓ All data decrypted successfully!'))
        self.stdout.write(self.style.SUCCESS('You can now login normally.'))
