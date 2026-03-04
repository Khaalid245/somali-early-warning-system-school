import { useEffect, useState } from 'react';
import { showToast } from '../../utils/toast';

export function useNotifications(dashboardData) {
  const [permission, setPermission] = useState(Notification.permission);
  const [lastNotificationTime, setLastNotificationTime] = useState({});

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (dashboardData && permission === 'granted') {
      checkAndNotify(dashboardData);
    }
  }, [dashboardData, permission]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        showToast.success('Notifications enabled');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  };

  const checkAndNotify = (data) => {
    const now = Date.now();
    
    // Notify about overdue cases (once per hour)
    if (data.overdue_cases > 0) {
      const key = 'overdue_cases';
      if (!lastNotificationTime[key] || now - lastNotificationTime[key] > 3600000) {
        sendNotification(
          'Overdue Follow-ups',
          `You have ${data.overdue_cases} overdue case${data.overdue_cases > 1 ? 's' : ''} requiring attention`,
          'warning'
        );
        setLastNotificationTime(prev => ({ ...prev, [key]: now }));
      }
    }

    // Notify about high-risk students needing immediate attention
    if (data.immediate_attention?.length > 0) {
      const key = 'immediate_attention';
      if (!lastNotificationTime[key] || now - lastNotificationTime[key] > 7200000) { // 2 hours
        sendNotification(
          'Immediate Attention Required',
          `${data.immediate_attention.length} student${data.immediate_attention.length > 1 ? 's need' : ' needs'} immediate intervention`,
          'urgent'
        );
        setLastNotificationTime(prev => ({ ...prev, [key]: now }));
      }
    }

    // Notify about new urgent alerts
    if (data.urgent_alerts?.length > 0) {
      const criticalAlerts = data.urgent_alerts.filter(a => a.risk_level === 'critical');
      if (criticalAlerts.length > 0) {
        const key = 'critical_alerts';
        if (!lastNotificationTime[key] || now - lastNotificationTime[key] > 1800000) { // 30 min
          sendNotification(
            'Critical Alert',
            `${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's require' : ' requires'} immediate action`,
            'critical'
          );
          setLastNotificationTime(prev => ({ ...prev, [key]: now }));
        }
      }
    }
  };

  const sendNotification = (title, body, type = 'info') => {
    if (permission !== 'granted') return;

    const icon = type === 'critical' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    try {
      const notification = new Notification(`${icon} ${title}`, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: type,
        requireInteraction: type === 'critical',
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds (except critical)
      if (type !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  return { permission, requestPermission };
}

export function NotificationSettings({ permission, requestPermission }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Browser Notifications</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            Get notified about urgent alerts, overdue cases, and high-risk students
          </p>
          <p className="text-xs text-gray-500">
            Status: <span className={`font-semibold ${
              permission === 'granted' ? 'text-green-600' : 
              permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {permission === 'granted' ? 'Enabled' : 
               permission === 'denied' ? 'Blocked' : 'Not Enabled'}
            </span>
          </p>
        </div>
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={permission === 'denied'}
          >
            {permission === 'denied' ? 'Blocked by Browser' : 'Enable Notifications'}
          </button>
        )}
      </div>
    </div>
  );
}
