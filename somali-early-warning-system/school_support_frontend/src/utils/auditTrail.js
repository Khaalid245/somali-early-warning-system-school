import api from '../api/apiClient';
import { sanitizeForLogs } from './encryption';

export const logAuditTrail = async (action, details) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    details: sanitizeForLogs(details),
    user: JSON.parse(localStorage.getItem('user') || '{}').username,
    sessionId: sessionStorage.getItem('sessionId') || 'unknown'
  };

  // Store in localStorage as backup
  const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
  auditLog.push(auditEntry);
  
  if (auditLog.length > 1000) {
    auditLog.shift();
  }
  
  localStorage.setItem('auditLog', JSON.stringify(auditLog));
  
  // Send to backend
  try {
    await api.post('/audit/', {
      action,
      details: sanitizeForLogs(details),
      sessionId: sessionStorage.getItem('sessionId') || ''
    });
  } catch (err) {
    console.error('[AUDIT] Failed to send to backend:', err);
  }
  
  console.log('[AUDIT]', auditEntry);
};

export const getAuditLog = () => {
  return JSON.parse(localStorage.getItem('auditLog') || '[]');
};

export const clearAuditLog = () => {
  localStorage.removeItem('auditLog');
};

export const exportAuditLogs = async () => {
  try {
    const response = await api.post('/audit/export/', {}, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('Failed to export audit logs:', err);
  }
};
