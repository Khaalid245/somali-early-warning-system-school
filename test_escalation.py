#!/usr/bin/env python
"""
Test script to simulate escalation API call
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(r'c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from interventions.models import InterventionCase
from interventions.serializers import InterventionCaseSerializer
from users.models import User

print("=== TESTING ESCALATION UPDATE ===\n")

# Find an open case to test with
open_case = InterventionCase.objects.filter(status='open').first()
if not open_case:
    print("No open cases found to test with")
    sys.exit(1)

print(f"Testing with Case #{open_case.case_id}")
print(f"Current status: {open_case.status}")
print(f"Student: {open_case.student.full_name}")

# Test the serializer update
data = {
    'status': 'escalated_to_admin',
    'escalation_reason': 'Test escalation from debug script',
    'version': open_case.version
}

print(f"\nAttempting to update with data: {data}")

serializer = InterventionCaseSerializer(open_case, data=data, partial=True)

if serializer.is_valid():
    print("SUCCESS: Serializer validation passed")
    updated_case = serializer.save()
    print(f"SUCCESS: Case updated successfully!")
    print(f"New status: {updated_case.status}")
    print(f"Escalation reason: {updated_case.escalation_reason}")
    print(f"Version: {updated_case.version}")
else:
    print("ERROR: Serializer validation failed:")
    print(serializer.errors)

# Check the database
updated_case = InterventionCase.objects.get(case_id=open_case.case_id)
print(f"\n=== DATABASE CHECK ===")
print(f"Case #{updated_case.case_id} status in DB: {updated_case.status}")
print(f"Escalation reason in DB: {updated_case.escalation_reason}")