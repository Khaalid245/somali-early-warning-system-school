import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';

// Left border by risk level: critical=red, high=orange, medium=yellow, low=green
const BORDER = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-400',
  medium:   'border-l-yellow-400',
  low:      'border-l-green-500',
};

// Priority label (simplified — no badge clutter)
const PRIORITY_LABEL = {
  critical: { text: 'Critical', cls: 'text-red-600 bg-red-50' },
  high:     { text: 'High',     cls: 'text-orange-600 bg-orange-50' },
  medium:   { text: 'Medium',   cls: 'text-yellow-700 bg-yellow-50' },
  low:      { text: 'Low',      cls: 'text-green-700 bg-green-50' },
};

const STATUS_TABS = [
  { key: 'active',       label: 'Active' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'escalated',    label: 'Escalated' },
  { key: 'resolved',     label: 'Resolved' },
];

function issueSummary(alert) {
  const parts = [];
  if (alert.days_missed > 0)
    parts.push(`${alert.days_missed} absence${alert.days_missed !== 1 ? 's' : ''} in 30 days`);
  if (alert.consecutive_absences > 0)
    parts.push(`${alert.consecutive_absences} consecutive`);
  if (alert.subject_missed > 0 && alert.subject_name)
    parts.push(`${alert.subject_missed} missed in ${alert.subject_name}`);
  return parts.join(' · ') || alert.alert_type?.replace('_', ' ') || '—';
}

export default function AlertsList({ alerts, onAlertAction, onReview, loadingKey }) {
  const [tab, setTab] = useState('active');

  const byTab = (alerts || []).filter(a => {
    if (tab === 'resolved') return a.status === 'resolved' || a.status === 'dismissed';
    return a.status === tab;
  });

  const counts = {
    active:       (alerts || []).filter(a => a.status === 'active').length,
    under_review: (alerts || []).filter(a => a.status === 'under_review').length,
    escalated:    (alerts || []).filter(a => a.status === 'escalated').length,
    resolved:     (alerts || []).filter(a => a.status === 'resolved' || a.status === 'dismissed').length,
  };

  return (
    <div>
      {/* ── Status Tabs ─────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-100 px-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                t.key === 'active' ? 'bg-red-100 text-red-700' :
                t.key === 'escalated' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Alert Cards ─────────────────────────────────────────────── */}
      {byTab.length === 0 ? (
        <div className="py-14 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">No {tab.replace('_', ' ')} alerts</p>
          <p className="text-xs text-gray-400 mt-1">
            {tab === 'active' ? 'All students are on track.' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {byTab.map(alert => {
            const level     = alert.risk_level?.toLowerCase() || 'low';
            const border    = BORDER[level]    || BORDER.low;
            const priority  = PRIORITY_LABEL[level] || PRIORITY_LABEL.low;
            const isProcessing = loadingKey === `alert-${alert.alert_id}`;
            const date = new Date(alert.alert_date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            });

            return (
              <div
                key={alert.alert_id}
                className={`flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-colors border-l-4 ${border}`}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: name + priority pill */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {alert.student_name}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${priority.cls}`}>
                      {priority.text}
                    </span>
                  </div>

                  {/* Row 2: class · date */}
                  <p className="text-xs text-gray-400 mb-1">
                    {alert.classroom_name && alert.classroom_name !== 'Not Enrolled'
                      ? `${alert.classroom_name} · `
                      : ''}
                    {date}
                  </p>

                  {/* Row 3: issue summary */}
                  <p className="text-xs text-gray-600">
                    {issueSummary(alert)}
                  </p>
                </div>

                {/* Actions — right aligned */}
                <div className="flex items-center gap-2 shrink-0">
                  {alert.status === 'active' && (
                    <>
                      <button
                        onClick={() => onReview(alert)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing ? '…' : 'Review'}
                      </button>
                      <button
                        onClick={() => onAlertAction(alert.alert_id, 'escalated')}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Escalate
                      </button>
                    </>
                  )}

                  {alert.status === 'under_review' && (
                    <button
                      onClick={() => onAlertAction(alert.alert_id, 'resolved')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? '…' : 'Resolve'}
                    </button>
                  )}

                  {(alert.status === 'resolved' || alert.status === 'dismissed') && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg">
                      <CheckCircle className="w-3 h-3" /> Resolved
                    </span>
                  )}

                  {alert.status === 'escalated_to_admin' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg">
                      <AlertTriangle className="w-3 h-3" /> Escalated
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
