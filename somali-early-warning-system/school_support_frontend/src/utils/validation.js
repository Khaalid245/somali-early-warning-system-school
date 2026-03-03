// Input validation and sanitization utilities
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input.trim());
};

export const validateInput = {
  studentName: (name) => {
    const sanitized = sanitizeInput(name);
    if (!sanitized || sanitized.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
    if (sanitized.length > 100) return { valid: false, error: 'Name too long (max 100 chars)' };
    if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) return { valid: false, error: 'Invalid characters in name' };
    return { valid: true, value: sanitized };
  },
  
  remarks: (remarks) => {
    const sanitized = sanitizeInput(remarks);
    if (sanitized.length > 500) return { valid: false, error: 'Remarks too long (max 500 chars)' };
    return { valid: true, value: sanitized };
  },
  
  searchQuery: (query) => {
    const sanitized = sanitizeInput(query);
    if (sanitized.length > 50) return { valid: false, error: 'Search query too long' };
    return { valid: true, value: sanitized };
  }
};

export const rateLimiter = {
  attempts: new Map(),
  
  checkLimit: function(key, maxAttempts = 10, windowMs = 60000) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return { allowed: false, resetTime: validAttempts[0] + windowMs };
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return { allowed: true };
  }
};