#!/usr/bin/env python
"""
Test escalation API directly via HTTP
"""
import requests
import json

# Test data
case_id = 8  # Use an open case
escalation_data = {
    'status': 'escalated_to_admin',
    'escalation_reason': 'Test escalation via direct API call - student not improving'
}

print(f"=== TESTING ESCALATION API ===")
print(f"Escalating Case #{case_id}")
print(f"Data: {escalation_data}")

try:
    # Make the API call
    response = requests.patch(
        f'http://127.0.0.1:8000/api/interventions/{case_id}/',
        json=escalation_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Data: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Escalation successful!")
    else:
        print("ERROR: Escalation failed!")
        
except Exception as e:
    print(f"ERROR: {e}")