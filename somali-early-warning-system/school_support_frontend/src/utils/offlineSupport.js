// Offline Support for Form Master Dashboard
const OFFLINE_CACHE_KEY = 'formmaster_offline_data';
const PENDING_ACTIONS_KEY = 'formmaster_pending_actions';

export const offlineSupport = {
  // Save data for offline use
  saveForOffline: (data) => {
    try {
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Failed to save offline data:', e);
    }
  },

  // Get offline data
  getOfflineData: () => {
    try {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      // Data valid for 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;
      return data;
    } catch (e) {
      return null;
    }
  },

  // Queue action for when online
  queueAction: (action) => {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
      pending.push({ ...action, queuedAt: Date.now() });
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    } catch (e) {
      console.error('Failed to queue action:', e);
    }
  },

  // Get pending actions
  getPendingActions: () => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },

  // Clear pending actions
  clearPendingActions: () => {
    localStorage.removeItem(PENDING_ACTIONS_KEY);
  },

  // Check if online
  isOnline: () => navigator.onLine
};
