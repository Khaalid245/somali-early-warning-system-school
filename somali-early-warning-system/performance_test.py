import time
import requests
import platform
import psutil
from datetime import datetime

def get_system_info():
    """Get actual system specifications"""
    return {
        "OS": f"{platform.system()} {platform.release()}",
        "Processor": platform.processor(),
        "RAM": f"{round(psutil.virtual_memory().total / (1024**3), 2)} GB",
        "CPU Cores": psutil.cpu_count(logical=False),
        "CPU Threads": psutil.cpu_count(logical=True)
    }

def test_api_response_time(url, iterations=10):
    """Test API response time"""
    times = []
    for _ in range(iterations):
        try:
            start = time.time()
            response = requests.get(url, timeout=10)
            end = time.time()
            if response.status_code == 200:
                times.append((end - start) * 1000)  # Convert to ms
        except:
            pass
    
    if times:
        return {
            "average": round(sum(times) / len(times), 2),
            "min": round(min(times), 2),
            "max": round(max(times), 2)
        }
    return None

def test_page_load_time(url):
    """Test page load time"""
    try:
        start = time.time()
        response = requests.get(url, timeout=30)
        end = time.time()
        if response.status_code == 200:
            return round((end - start), 2)
    except:
        pass
    return None

def main():
    print("=" * 60)
    print("PERFORMANCE TEST REPORT")
    print("=" * 60)
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # System Info
    print("SYSTEM SPECIFICATIONS:")
    print("-" * 60)
    sys_info = get_system_info()
    for key, value in sys_info.items():
        print(f"{key}: {value}")
    print()
    
    # Test URLs
    frontend_url = "https://www.alifmonitor.com"
    api_url = "https://www.alifmonitor.com/api/health/"
    
    # Frontend Load Time
    print("FRONTEND PERFORMANCE:")
    print("-" * 60)
    load_time = test_page_load_time(frontend_url)
    if load_time:
        print(f"Page Load Time: {load_time}s")
    else:
        print("Page Load Time: Unable to measure (check if site is running)")
    print()
    
    # API Response Time
    print("API PERFORMANCE:")
    print("-" * 60)
    api_times = test_api_response_time(api_url, iterations=20)
    if api_times:
        print(f"Average Response Time: {api_times['average']}ms")
        print(f"Min Response Time: {api_times['min']}ms")
        print(f"Max Response Time: {api_times['max']}ms")
    else:
        print("API Response Time: Unable to measure (check if API is running)")
    print()
    
    # CPU and Memory Usage
    print("SYSTEM RESOURCES:")
    print("-" * 60)
    print(f"CPU Usage: {psutil.cpu_percent(interval=1)}%")
    print(f"Memory Usage: {psutil.virtual_memory().percent}%")
    print(f"Available Memory: {round(psutil.virtual_memory().available / (1024**3), 2)} GB")
    print()
    
    print("=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
