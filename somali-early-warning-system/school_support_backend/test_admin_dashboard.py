"""
Quick test for Admin Dashboard API
Run: python test_admin_dashboard.py
"""

import requests

# Test admin dashboard endpoint
url = "http://127.0.0.1:8000/api/dashboard/admin/"

# You need to add your admin token here
headers = {
    "Authorization": "Bearer YOUR_TOKEN_HERE"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ SUCCESS! Dashboard data received:")
        print(f"- Total Students: {data.get('executive_kpis', {}).get('total_students')}")
        print(f"- Active Alerts: {data.get('executive_kpis', {}).get('active_alerts')}")
        print(f"- Risk Index: {data.get('system_health', {}).get('risk_index')}")
    else:
        print(f"\n❌ ERROR: {response.text}")
        
except Exception as e:
    print(f"\n❌ Connection Error: {e}")
    print("Make sure Django server is running: python manage.py runserver")
