import { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import { Clock } from 'lucide-react';

const RISK_BADGE = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low:      'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_BADGE = {
  resolved:  'bg-green-50 text-green-700 border border-green-200',
  dismissed: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alerts/history/')
      .then(res => setAlerts(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => showToast.error('Failed to load alert history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading history…</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        No resolved or dismissed alerts in the last 30 days.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {alerts.map((alert) => (
        <div key={alert.alert_id} className="p-5 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE[alert.risk_level?.toLowerCase()] || RISK_BADGE.low}`}>
                  {alert.risk_level?.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[alert.status] || STATUS_BADGE.dismissed}`}>
                  {alert.status?.toUpperCase()}
                </span>
                {alert.alert_type && (
                  <span className="text-xs text-gray-400">{alert.alert_type.replace('_', ' ')}</span>
                )}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{alert.student_name}</p>
              <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-gray-500">
                {alert.classroom_name && alert.classroom_name !== 'Not Enrolled' && (
                  <span>Class: <span className="text-gray-700">{alert.classroom_name}</span></span>
                )}
                {alert.subject_name && (
                  <span>Subject: <span className="text-gray-700">{alert.subject_name}</span></span>
                )}
                {alert.days_missed > 0 && (
                  <span className="text-red-500">{alert.days_missed} absences (30d)</span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {new Date(alert.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
