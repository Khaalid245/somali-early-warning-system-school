#!/usr/bin/env python
"""
Test admin dashboard API directly
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(r'c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from dashboard.admin_view import AdminDashboardView
from django.test import RequestFactory
from users.models import User

print("=== TESTING ADMIN DASHBOARD API ===\n")

# Create a fake request
factory = RequestFactory()
request = factory.get('/dashboard/admin/')

# Get admin user
admin_user = User.objects.filter(role='admin').first()
if not admin_user:
    print("No admin user found!")
    sys.exit(1)

request.user = admin_user

# Call the view
view = AdminDashboardView()
response = view.get(request)

print(f"Response status: {response.status_code}")

if response.status_code == 200:
    data = response.data
    escalated_cases = data.get('escalated_cases', [])
    print(f"Escalated cases count: {len(escalated_cases)}")
    
    for case in escalated_cases:
        print(f"Case #{case['case_id']}: {case['student_name']} - {case['escalation_reason']}")
else:
    print(f"Error: {response.data}")