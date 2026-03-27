import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()
from students.models import Classroom
print('Classrooms:')
for c in Classroom.objects.all():
    print(f'  class_id={c.class_id} name={c.name}')
