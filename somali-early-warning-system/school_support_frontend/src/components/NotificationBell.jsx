import { useState, useEffect } from 'react';
import api from '../api/apiClient';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/cases/?status=escalated_to_admin&page_size=10');
      const cases = res.data.results || [];
      setNotifications(cases);
      setUnreadCount(cases.length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  if (user?.role !== 'admin' || unreadCount === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Escalated Cases</h3>
              <p className="text-xs text-gray-500">{unreadCount} cases need your attention</p>
            </div>
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.case_id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.location.href = '/admin';
                    window.dispatchEvent(new CustomEvent('adminTabChange', { detail: 'cases' }));
                    setShowDropdown(false);
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800">
                    Case #{notification.case_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.student?.full_name || 'Student'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Escalated by Form Master
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
