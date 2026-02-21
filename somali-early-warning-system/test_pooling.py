"""
Test database connection pooling with concurrent requests
"""
import requests
import threading
import time
from datetime import datetime

BASE_URL = 'http://127.0.0.1:8000'
NUM_CONCURRENT_USERS = 50

def make_request(user_id):
    """Simulate a user making a dashboard request"""
    try:
        start = time.time()
        response = requests.get(
            f'{BASE_URL}/api/interventions/dashboard/',
            headers={'Authorization': 'Bearer YOUR_TOKEN_HERE'}  # Replace with real token
        )
        duration = (time.time() - start) * 1000
        
        status = "✓" if response.status_code == 200 else "✗"
        print(f"{status} User {user_id}: {response.status_code} in {duration:.0f}ms")
        
        return response.status_code == 200
    except Exception as e:
        print(f"✗ User {user_id}: Error - {e}")
        return False

def test_concurrent_load():
    """Test with multiple concurrent users"""
    print(f"\n{'='*60}")
    print(f"Testing Connection Pooling with {NUM_CONCURRENT_USERS} Concurrent Users")
    print(f"{'='*60}\n")
    
    threads = []
    results = []
    start_time = time.time()
    
    # Create threads
    for i in range(NUM_CONCURRENT_USERS):
        t = threading.Thread(target=lambda uid=i: results.append(make_request(uid)))
        threads.append(t)
    
    # Start all threads
    for t in threads:
        t.start()
    
    # Wait for completion
    for t in threads:
        t.join()
    
    total_time = time.time() - start_time
    success_count = sum(1 for r in results if r)
    
    print(f"\n{'='*60}")
    print(f"Results:")
    print(f"  Total requests: {NUM_CONCURRENT_USERS}")
    print(f"  Successful: {success_count}")
    print(f"  Failed: {NUM_CONCURRENT_USERS - success_count}")
    print(f"  Total time: {total_time:.2f}s")
    print(f"  Avg time per request: {(total_time/NUM_CONCURRENT_USERS)*1000:.0f}ms")
    print(f"{'='*60}\n")
    
    if success_count == NUM_CONCURRENT_USERS:
        print("✓ PASS: Connection pooling working correctly!")
    else:
        print("✗ FAIL: Some requests failed - check connection pooling config")

if __name__ == '__main__':
    print("\nMake sure:")
    print("1. Backend is running: python manage.py runserver")
    print("2. You have a valid auth token")
    print("3. Database connection pooling is configured\n")
    
    input("Press Enter to start test...")
    test_concurrent_load()
