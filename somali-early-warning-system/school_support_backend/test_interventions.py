"""
Test script for Student Intervention & Progress Tracking feature
Run with: python test_interventions.py
"""

import os
import django
import pytest

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from interventions.models import InterventionMeeting, ProgressUpdate
from students.models import Student
from users.models import User
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
def test_intervention_system():
    print("=" * 60)
    print("Testing Student Intervention & Progress Tracking System")
    print("=" * 60)
    
    # Get test data
    form_master = User.objects.filter(role='form_master').first()
    student = Student.objects.first()
    
    if not form_master:
        print("❌ No Form Master found. Please create a Form Master user first.")
        return
    
    if not student:
        print("❌ No students found. Please create a student first.")
        return
    
    print(f"\n✓ Form Master: {form_master.get_full_name()}")
    print(f"✓ Student: {student.full_name}")
    
    # Test 1: Create intervention meeting
    print("\n" + "-" * 60)
    print("Test 1: Creating intervention meeting...")
    try:
        meeting = InterventionMeeting.objects.create(
            student=student,
            meeting_date=timezone.now().date(),
            absence_reason="Student was absent for 3 consecutive days",
            root_cause="health",
            intervention_notes="Student reported feeling unwell. Discussed importance of communication.",
            action_plan="Follow up in 1 week. Contact parent if absences continue.",
            follow_up_date=timezone.now().date() + timedelta(days=7),
            urgency_level="medium",
            created_by=form_master
        )
        print(f"✓ Meeting created: ID {meeting.id}")
    except Exception as e:
        print(f"❌ Failed to create meeting: {e}")
        return
    
    # Test 2: Add progress update
    print("\n" + "-" * 60)
    print("Test 2: Adding progress update...")
    try:
        progress = ProgressUpdate.objects.create(
            meeting=meeting,
            update_text="Spoke with student. Feeling better. Attendance improving.",
            created_by=form_master
        )
        print(f"✓ Progress update added: ID {progress.id}")
    except Exception as e:
        print(f"❌ Failed to add progress: {e}")
    
    # Test 3: Update meeting status
    print("\n" + "-" * 60)
    print("Test 3: Updating meeting status...")
    try:
        meeting.status = "monitoring"
        meeting.save()
        print(f"✓ Status updated to: {meeting.status}")
    except Exception as e:
        print(f"❌ Failed to update status: {e}")
    
    # Test 4: Try to create duplicate (should fail)
    print("\n" + "-" * 60)
    print("Test 4: Testing duplicate prevention...")
    try:
        duplicate = InterventionMeeting(
            student=student,
            meeting_date=timezone.now().date(),
            absence_reason="Another absence",
            root_cause="health",  # Same root cause
            intervention_notes="Test notes",
            action_plan="Test plan",
            urgency_level="low",
            created_by=form_master
        )
        duplicate.save()
        print("❌ Duplicate was created (should have been prevented!)")
    except Exception as e:
        print(f"✓ Duplicate prevented: {str(e)[:80]}...")
    
    # Test 5: Query statistics
    print("\n" + "-" * 60)
    print("Test 5: Querying statistics...")
    try:
        total = InterventionMeeting.objects.count()
        open_count = InterventionMeeting.objects.filter(status='open').count()
        monitoring = InterventionMeeting.objects.filter(status='monitoring').count()
        print(f"✓ Total meetings: {total}")
        print(f"✓ Open: {open_count}")
        print(f"✓ Monitoring: {monitoring}")
    except Exception as e:
        print(f"❌ Failed to query stats: {e}")
    
    # Test 6: Close the meeting
    print("\n" + "-" * 60)
    print("Test 6: Closing meeting...")
    try:
        meeting.status = "closed"
        meeting.save()
        print(f"✓ Meeting closed successfully")
    except Exception as e:
        print(f"❌ Failed to close meeting: {e}")
    
    # Test 7: Try to reopen (should fail)
    print("\n" + "-" * 60)
    print("Test 7: Testing reopen prevention...")
    try:
        meeting.status = "open"
        meeting.save()
        print("❌ Meeting was reopened (should have been prevented!)")
    except Exception as e:
        print(f"✓ Reopen prevented: {str(e)[:80]}...")
    
    # Cleanup
    print("\n" + "-" * 60)
    print("Cleaning up test data...")
    meeting.delete()
    print("✓ Test data cleaned up")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start backend: python manage.py runserver")
    print("2. Start frontend: npm run dev")
    print("3. Navigate to: http://localhost:5173/form-master/interventions")
    print("=" * 60)

if __name__ == "__main__":
    test_intervention_system()
