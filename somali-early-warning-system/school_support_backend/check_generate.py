import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from academics.timetable_generator import generate_timetable_for_classroom
from users.models import User

admin = User.objects.filter(role='admin').first()
print('Admin:', admin)

# Test with classroom_id=1
result = generate_timetable_for_classroom(1, admin, '2024-2025', 'Term 1')
print('Result:', result)
