import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from dashboard.services import get_teacher_dashboard_data

User = get_user_model()

# Get a teacher user
teacher = User.objects.filter(role='teacher').first()

if not teacher:
    print("❌ No teacher found. Please create a teacher user first.")
    exit()

print(f"[OK] Testing dashboard for teacher: {teacher.name}")
print("=" * 60)

# Get dashboard data
data = get_teacher_dashboard_data(teacher, {})

# Check new features
print("\n[CHECKING NEW FEATURES]\n")

print("1. Action Items (Enhanced):")
if 'action_items' in data:
    for item in data['action_items'][:3]:
        print(f"   - {item.get('category', 'N/A')}")
        print(f"     Priority: {item.get('priority', 'N/A')}")
        print(f"     Action: {item.get('action', 'N/A')}")
        print(f"     Recommendation: {item.get('recommendation', 'N/A')}\n")
else:
    print("   [X] NOT FOUND\n")

print("2. Semester Comparison:")
if 'semester_comparison' in data:
    comp = data['semester_comparison']
    print(f"   Current: {comp['current_semester']['attendance_rate']}%")
    print(f"   Previous: {comp['previous_semester']['attendance_rate']}%")
    print(f"   Trend: {comp['comparison']['trend']}\n")
else:
    print("   [X] NOT FOUND\n")

print("3. Student Progress Tracking:")
if 'student_progress_tracking' in data:
    print(f"   Found {len(data['student_progress_tracking'])} students")
    for student in data['student_progress_tracking'][:2]:
        print(f"   - {student['student_name']}: {student['trend']} ({student['change']:+.1f}%)")
    print()
else:
    print("   [X] NOT FOUND\n")

print("4. AI Insights:")
if 'insights' in data:
    print(f"   Found {len(data['insights'])} insights")
    for insight in data['insights'][:2]:
        print(f"   - {insight['title']}")
        print(f"     Type: {insight['type']}")
    print()
else:
    print("   [X] NOT FOUND\n")

print("=" * 60)
print("\n[OK] Test complete! Check above for feature status.")
print("\n[TIP] If features show 'NOT FOUND', restart your backend:")
print("   python manage.py runserver")
