// Audit logging system for FERPA compliance
export const auditLogger = {
  log: async (action, details) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      user: sessionStorage.getItem('user_id') || 'anonymous',
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      userAgent: navigator.userAgent
    };
    
    try {
      // Store locally first (offline support)
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.push(auditEntry);
      
      // Keep only last 1000 entries locally
      if (logs.length > 1000) logs.splice(0, logs.length - 1000);
      localStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (error) {
      // Silent fail
    }
  }
};

// Audit actions
export const AUDIT_ACTIONS = {
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  ATTENDANCE_CREATE: 'attendance_create',
  ATTENDANCE_UPDATE: 'attendance_update',
  ATTENDANCE_VIEW: 'attendance_view',
  STUDENT_VIEW: 'student_view',
  DATA_EXPORT: 'data_export',
  SETTINGS_CHANGE: 'settings_change'
};