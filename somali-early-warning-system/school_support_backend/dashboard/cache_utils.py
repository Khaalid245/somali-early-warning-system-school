from django.core.cache import cache
from django.utils import timezone
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

# FIX: Enhanced Redis caching with multi-level strategy

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
    """Cache dashboard data with Redis (5 min default)"""
    try:
        cache.set(cache_key, data, timeout)
        logger.info(f"Cached dashboard data: {cache_key}")
    except Exception as e:
        logger.error(f"Cache set failed: {e}")
    return data


def get_cached_dashboard_data(cache_key):
    """Get cached dashboard data from Redis"""
    try:
        data = cache.get(cache_key)
        if data:
            logger.info(f"Cache hit: {cache_key}")
        return data
    except Exception as e:
        logger.error(f"Cache get failed: {e}")
        return None


def cache_query_result(key, queryset, timeout=300):
    """Cache expensive query results"""
    try:
        data = list(queryset)
        cache.set(key, data, timeout)
        return data
    except Exception as e:
        logger.error(f"Query cache failed: {e}")
        return list(queryset)


def get_cached_query(key):
    """Get cached query result"""
    try:
        return cache.get(key)
    except Exception as e:
        logger.error(f"Query cache get failed: {e}")
        return None


def invalidate_teacher_cache(teacher_id):
    """Invalidate teacher dashboard cache when data changes"""
    from datetime import date
    today = date.today().isoformat()
    
    # Try common filter combinations
    filter_combinations = [
        {},
        {'time_range': 'current_month'},
        {'time_range': 'current_week'},
        {'time_range': 'current_semester'},
    ]
    
    for filters in filter_combinations:
        cache_key = get_cache_key('teacher', teacher_id, filters)
        cache.delete(cache_key)
    
    # Also delete the base key without filters
    base_key = f"dashboard_teacher_{teacher_id}_{today}"
    cache.delete(base_key)
    logger.info(f"Invalidated cache for teacher {teacher_id}")


def invalidate_pattern(pattern):
    """Invalidate all cache keys matching pattern (Redis only)"""
    try:
        from django_redis import get_redis_connection
        conn = get_redis_connection("default")
        keys = conn.keys(f"*{pattern}*")
        if keys:
            conn.delete(*keys)
            logger.info(f"Invalidated {len(keys)} keys matching {pattern}")
    except Exception as e:
        logger.warning(f"Pattern invalidation failed (using LocMem?): {e}")


def warm_cache(user, role):
    """Pre-warm cache with common queries"""
    from .services import get_teacher_dashboard_data, get_admin_dashboard_data, get_form_master_dashboard_data
    
    try:
        if role == 'teacher':
            get_teacher_dashboard_data(user, {})
        elif role == 'admin':
            get_admin_dashboard_data(user, {})
        elif role == 'form_master':
            get_form_master_dashboard_data(user, {})
        logger.info(f"Warmed cache for {role} user {user.id}")
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")