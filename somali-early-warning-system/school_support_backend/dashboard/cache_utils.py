from django.core.cache import cache
from django.utils import timezone
import hashlib
import json


def get_cache_key(prefix, user_id, filters=None):
    """Generate a cache key for dashboard data"""
    key_data = {
        'user_id': user_id,
        'filters': filters or {},
        'date': timezone.now().date().isoformat()
    }
    key_string = json.dumps(key_data, sort_keys=True)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    return f"dashboard_{prefix}_{key_hash}"


def cache_dashboard_data(cache_key, data, timeout=300):
    """Cache dashboard data for 5 minutes by default"""
    cache.set(cache_key, data, timeout)
    return data


def get_cached_dashboard_data(cache_key):
    """Get cached dashboard data"""
    return cache.get(cache_key)


def invalidate_teacher_cache(teacher_id):
    """Invalidate teacher dashboard cache when data changes"""
    # This would be called when attendance is recorded or alerts are created
    cache_pattern = f"dashboard_teacher_*{teacher_id}*"
    # Note: Django's default cache doesn't support pattern deletion
    # In production, consider using Redis with pattern deletion
    pass