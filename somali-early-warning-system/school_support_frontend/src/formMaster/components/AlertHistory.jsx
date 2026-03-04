import { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/alerts/history/');
      setAlerts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      showToast.error('Failed to load alert history');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading history...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No resolved alerts in the last 30 days
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {alerts.map((alert) => (
        <div key={alert.alert_id} className="p-6 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(alert.risk_level)}`}>
                  {alert.risk_level?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  alert.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {alert.status?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {alert.subject_name || 'General'}
                </span>
              </div>
              <p className="font-semibold text-gray-800">{alert.student_name}</p>
              <p className="text-sm text-gray-600">ID: {alert.student}</p>
              <p className="text-xs text-gray-500 mt-1">
                Resolved: {new Date(alert.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
