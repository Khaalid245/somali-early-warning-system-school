"""
Test Rate Limiting on Login Endpoint
Run: python test_rate_limiting.py
"""
import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_rate_limiting():
    print("Testing Rate Limiting (10 requests per hour)\\n")
    
    # Make 11 login attempts
    for i in range(1, 12):
        response = requests.post(f"{BASE_URL}/auth/login/", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        print(f"Request {i}: Status {response.status_code}", end="")
        
        if response.status_code == 429:
            print(" - RATE LIMITED!")
            print(f"Response: {response.json()}")
            print(f"\\nPASS: Rate limiting working! Blocked after {i-1} requests")
            return
        else:
            print(f" - {response.json().get('detail', 'Failed')}")
        
        time.sleep(0.5)  # Small delay between requests
    
    print("\\nFAIL: Rate limiting not enforced (made 11 requests without blocking)")

if __name__ == "__main__":
    test_rate_limiting()
