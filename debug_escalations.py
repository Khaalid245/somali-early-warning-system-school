#!/usr/bin/env python
"""
Debug script to check escalated cases in database
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
from django.utils import timezone
from datetime import timedelta

print("=== DEBUGGING ESCALATED CASES ===\n")

# Check all cases
all_cases = InterventionCase.objects.all()
print(f"Total cases in database: {all_cases.count()}")

# Check escalated cases
escalated_cases = InterventionCase.objects.filter(status='escalated_to_admin')
print(f"Cases with status 'escalated_to_admin': {escalated_cases.count()}")

print("\n=== ALL CASES STATUS BREAKDOWN ===")
status_counts = {}
for case in all_cases:
    status = case.status
    status_counts[status] = status_counts.get(status, 0) + 1

for status, count in status_counts.items():
    print(f"  {status}: {count}")

print("\n=== ESCALATED CASES DETAILS ===")
for case in escalated_cases:
    print(f"Case #{case.case_id}:")
    print(f"  Student: {case.student.full_name}")
    print(f"  Status: {case.status}")
    print(f"  Created: {case.created_at}")
    print(f"  Updated: {case.updated_at}")
    print(f"  Escalation Reason: {case.escalation_reason}")
    print(f"  Days ago: {(timezone.now() - case.updated_at).days}")
    print()

print("\n=== RECENT CASES (Last 30 days) ===")
thirty_days_ago = timezone.now() - timedelta(days=30)
recent_cases = InterventionCase.objects.filter(updated_at__gte=thirty_days_ago)
print(f"Cases updated in last 30 days: {recent_cases.count()}")

for case in recent_cases:
    print(f"Case #{case.case_id}: {case.status} - {case.student.full_name} - {case.updated_at.strftime('%Y-%m-%d %H:%M')}")