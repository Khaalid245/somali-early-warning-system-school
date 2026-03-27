import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from academics.timetable_generator import generate_timetable_for_classroom
from students.models import Classroom
from users.models import User

admin = User.objects.filter(role='admin').first()
classrooms = Classroom.objects.all()

for classroom in classrooms:
    result = generate_timetable_for_classroom(classroom.class_id, admin, '2024-2025', 'Term 1')
    print(f'{classroom.name}: success={result["success"]}')
    if not result['success']:
        print('  Errors:', result.get('errors'))
    else:
        print(' ', result.get('message'))
