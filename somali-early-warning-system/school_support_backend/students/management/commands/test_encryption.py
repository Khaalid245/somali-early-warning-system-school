"""
Test encryption functionality
Run: python manage.py test_encryption
"""
from django.core.management.base import BaseCommand
from core.encryption import encrypt_data, decrypt_data


class Command(BaseCommand):
    help = 'Test encryption/decryption functionality'

    def handle(self, *args, **options):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('ENCRYPTION TEST')
        self.stdout.write('='*60 + '\n')
        
        # Test data
        test_cases = [
            "Ahmed Mohamed",
            "teacher@school.com",
            "+252-61-234-5678"
        ]
        
        for original in test_cases:
            # Encrypt
            encrypted = encrypt_data(original)
            
            # Decrypt
            decrypted = decrypt_data(encrypted)
            
            # Display results
            self.stdout.write(f'Original:  {original}')
            self.stdout.write(f'Encrypted: {encrypted[:50]}...')
            self.stdout.write(f'Decrypted: {decrypted}')
            
            if original == decrypted:
                self.stdout.write(self.style.SUCCESS('✓ PASS\n'))
            else:
                self.stdout.write(self.style.ERROR('✗ FAIL\n'))
        
        self.stdout.write('='*60)
        self.stdout.write(self.style.SUCCESS('✓ Encryption test completed!'))
        self.stdout.write('='*60 + '\n')
