"""
Comprehensive Security Test Suite
Tests: Replay Protection + Rate Limiting
Run: python test_security_improvements.py
"""
import requests
import time
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_replay_protection():
    print("=" * 60)
    print("TEST 1: REPLAY PROTECTION")
    print("=" * 60)
    
    # Test with valid nonce
    nonce = str(uuid.uuid4())
    timestamp = str(time.time())
    headers = {
        "X-Request-Nonce": nonce,
        "X-Request-Timestamp": timestamp
    }
    
    print("\n1. First request with nonce...")
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    }, headers=headers)
    print(f"   Status: {response.status_code} (Expected: 401 - login fails but passes middleware)")
    
    # Replay same nonce
    print("\n2. Replaying same nonce (should be blocked)...")
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "test@example.com",
        "password": "test123"
    }, headers=headers)
    
    if response.status_code == 409:
        print(f"   Status: {response.status_code} - PASS: Replay blocked!")
        print(f"   Response: {response.json()}")
        return True
    else:
        print(f"   Status: {response.status_code} - FAIL: Replay not blocked")
        return False

def test_rate_limiting():
    print("\n" + "=" * 60)
    print("TEST 2: RATE LIMITING (10 requests/hour)")
    print("=" * 60)
    
    print("\nMaking 11 login attempts...")
    
    for i in range(1, 12):
        # Use unique nonce for each request to avoid replay protection
        headers = {
            "X-Request-Nonce": str(uuid.uuid4()),
            "X-Request-Timestamp": str(time.time())
        }
        
        response = requests.post(f"{BASE_URL}/auth/login/", json={
            "email": f"test{i}@example.com",
            "password": "wrongpassword"
        }, headers=headers)
        
        print(f"   Request {i:2d}: Status {response.status_code}", end="")
        
        if response.status_code == 429:
            print(" - RATE LIMITED!")
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Response: {response.text}")
            print(f"\n   PASS: Rate limiting working! Blocked after {i-1} requests")
            return True
        else:
            if response.status_code == 401:
                print(" - Unauthorized (expected)")
            else:
                print(f" - {response.status_code}")
        
        time.sleep(0.3)  # Small delay
    
    print("\n   FAIL: Rate limiting not enforced (made 11 requests without blocking)")
    return False

def test_dashboard_throttling():
    print("\n" + "=" * 60)
    print("TEST 3: DASHBOARD THROTTLING (requires auth)")
    print("=" * 60)
    print("   SKIPPED: Requires valid authentication token")
    print("   To test manually: Login and make 101 dashboard requests")
    return None

def main():
    print("\n")
    print("*" * 60)
    print("  SECURITY IMPROVEMENTS TEST SUITE")
    print("*" * 60)
    print("\nEnsure Django server is running: python manage.py runserver")
    print("\nPress Enter to start tests...")
    input()
    
    results = []
    
    # Test 1: Replay Protection
    try:
        result = test_replay_protection()
        results.append(("Replay Protection", result))
    except Exception as e:
        print(f"\n   ERROR: {e}")
        results.append(("Replay Protection", False))
    
    # Test 2: Rate Limiting
    try:
        result = test_rate_limiting()
        results.append(("Rate Limiting", result))
    except Exception as e:
        print(f"\n   ERROR: {e}")
        results.append(("Rate Limiting", False))
    
    # Test 3: Dashboard Throttling
    result = test_dashboard_throttling()
    if result is not None:
        results.append(("Dashboard Throttling", result))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = "[+]" if result else "[-]"
        print(f"{symbol} {test_name}: {status}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\nAll security improvements are working correctly!")
    else:
        print("\nSome tests failed. Please review the output above.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
    except requests.exceptions.ConnectionError:
        print("\n\nERROR: Cannot connect to Django server.")
        print("Please ensure the server is running: python manage.py runserver")
