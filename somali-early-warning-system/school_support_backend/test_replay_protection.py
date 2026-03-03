"""
Test Replay Protection Middleware
Run: python test_replay_protection.py
"""
import requests
import time
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_replay_protection():
    print("Testing Replay Protection Middleware\n")
    
    # Test 1: Request without nonce (should pass)
    print("Test 1: Request without nonce headers...")
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    })
    print(f"Status: {response.status_code} (Expected: 400 or 401 - login will fail but middleware passes)\n")
    
    # Test 2: Request with valid nonce (should pass)
    print("Test 2: Request with valid nonce...")
    nonce = str(uuid.uuid4())
    timestamp = str(time.time())
    headers = {
        "X-Request-Nonce": nonce,
        "X-Request-Timestamp": timestamp
    }
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    }, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400 or 401)\n")
    
    # Test 3: Replay same nonce (should fail with 409)
    print("Test 3: Replaying same nonce (should be blocked)...")
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    }, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 409:
        print(f"PASS: Replay attack blocked! Response: {response.json()}\n")
    else:
        print(f"FAIL: Replay attack not blocked\n")
    
    # Test 4: Expired timestamp (should fail with 400)
    print("Test 4: Request with expired timestamp...")
    old_timestamp = str(time.time() - 400)  # 400 seconds ago (> 5 minutes)
    headers = {
        "X-Request-Nonce": str(uuid.uuid4()),
        "X-Request-Timestamp": old_timestamp
    }
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    }, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        print(f"PASS: Expired request blocked! Response: {response.json()}\n")
    else:
        print(f"FAIL: Expired request not blocked\n")
    
    print("Replay Protection Tests Complete!")

if __name__ == "__main__":
    test_replay_protection()
