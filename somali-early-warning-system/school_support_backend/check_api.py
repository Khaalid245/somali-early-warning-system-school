import requests
import json

# Test the admin dashboard endpoint directly
# First login to get token
login_url = "http://127.0.0.1:8000/api/auth/login/"
dashboard_url = "http://127.0.0.1:8000/api/dashboard/admin/"

try:
    # Try to get dashboard data with session
    session = requests.Session()
    
    # Login
    login_resp = session.post(login_url, json={"username": "admin", "password": "admin"}, timeout=5)
    print("Login status:", login_resp.status_code)
    print("Login response:", login_resp.text[:200])
    
    # Get dashboard
    dash_resp = session.get(dashboard_url, timeout=5)
    print("Dashboard status:", dash_resp.status_code)
    
    if dash_resp.status_code == 200:
        data = dash_resp.json()
        print("monthly_alert_trend:", data.get("monthly_alert_trend"))
        print("monthly_case_trend:", data.get("monthly_case_trend"))
    else:
        print("Dashboard error:", dash_resp.text[:300])
        
except Exception as e:
    print("Error:", e)
