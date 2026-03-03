// Simple in-memory cache with TTL
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  set(key, data, customTTL = null) {
    const expiry = Date.now() + (customTTL || this.ttl);
    this.cache.set(key, { data, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Clear expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheManager();

// Auto cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD_DATA: 'dashboard_data',
  MY_CLASSES: 'my_classes',
  STUDENTS: (classId) => `students_${classId}`,
  ASSIGNMENTS: 'assignments',
  SUBJECTS: 'subjects',
  CLASSROOMS: 'classrooms'
};