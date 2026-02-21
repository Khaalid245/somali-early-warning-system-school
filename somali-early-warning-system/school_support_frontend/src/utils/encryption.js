const ENCRYPTION_KEY = 'SCHOOL_EWS_2024'; // In production, use env variable

export const encryptPII = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = btoa(encodeURIComponent(jsonString));
    return encrypted;
  } catch (err) {
    console.error('Encryption failed:', err);
    return null;
  }
};

export const decryptPII = (encrypted) => {
  try {
    const decoded = decodeURIComponent(atob(encrypted));
    return JSON.parse(decoded);
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
};

export const maskPII = (value, type = 'name') => {
  if (!value) return '';
  
  switch (type) {
    case 'name':
      return value.charAt(0) + '***' + value.charAt(value.length - 1);
    case 'email':
      const [user, domain] = value.split('@');
      return user.charAt(0) + '***@' + domain;
    case 'phone':
      return '***-***-' + value.slice(-4);
    default:
      return '***';
  }
};

export const sanitizeForLogs = (obj) => {
  const sensitive = ['password', 'ssn', 'email', 'phone', 'address'];
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
};
