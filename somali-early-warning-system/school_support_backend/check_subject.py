import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from academics.models import Subject
print("Subject reverse relations:")
for f in Subject._meta.get_fields():
    print(f"  {f.name}  ({type(f).__name__})")
