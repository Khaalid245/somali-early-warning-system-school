import { useState, useEffect } from 'react';
import { Bell, Download, Search, User, Eye, XCircle, AlertCircle, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

const RISK_BADGE = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-amber-50 text-amber-700 border-amber-200',
  medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:      'bg-green-50 text-green-700 border-green-200',
};

const RISK_ICON = {
  critical: AlertCircle,
  high:     AlertTriangle,
  medium:   Activity,
  low:      CheckCircle,
};

const STATUS_BADGE = {
  active:       'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  escalated:    'bg-red-50 text-red-700 border-red-200',
  resolved:     'bg-green-50 text-green-700 border-green-200',
  dismissed:    'bg-gray-50 text-gray-600 border-gray-200',
};

export default function AlertManagement({ data, onRefresh }) {
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailsModal, setDetailsModal]   = useState(false);
  const [filters, setFilters] = useState({ risk_level: '', status: '', search: '' });

  useEffect(() => { loadAlerts(); }, []);
  useEffect(() => { loadAlerts(); }, [filters]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)     params.append('search',     filters.search);
      if (filters.risk_level) params.append('risk_level', filters.risk_level);
      if (filters.status)     params.append('status',     filters.status);
      const res = await api.get(`/alerts/?${params.toString()}`);
      setAlerts(res.data.results || res.data || []);
    } catch {
      showToast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Alert ID', 'Student', 'Type', 'Risk Level', 'Status', 'Date'].join(','),
      ...alerts.map(a => [
        a.alert_id,
        a.student_name || 'Unknown',
        a.alert_type,
        a.risk_level,
        a.status,
        new Date(a.alert_date).toLocaleDateString()
      ].join(','))
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast.success('Exported successfully');
  };

  const openDetails = (alert) => { setSelectedAlert(alert); setDetailsModal(true); };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Student Alerts</p>
          <p className="text-xs text-gray-400 mt-0.5">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search student..."
            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        <select
          value={filters.risk_level}
          onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
          className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-600 outline-none"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-600 outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under review</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {(filters.search || filters.risk_level || filters.status) && (
          <button
            onClick={() => setFilters({ risk_level: '', status: '', search: '' })}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No alerts found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Student</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Classroom</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Risk</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">Date</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alerts.map((alert) => {
                const RiskIcon = RISK_ICON[alert.risk_level] || Activity;
                return (
                  <tr
                    key={alert.alert_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                      {alert.alert_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">
                          {alert.student_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {alert.classroom_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${RISK_BADGE[alert.risk_level] || RISK_BADGE.low}`}>
                        <RiskIcon className="w-3 h-3" />
                        {alert.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_BADGE[alert.status] || STATUS_BADGE.active}`}>
                        {alert.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize hidden lg:table-cell">
                      {alert.alert_type}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {new Date(alert.alert_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetails(alert)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal — unchanged */}
      {detailsModal && selectedAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-sm font-medium text-gray-900">Alert #{selectedAlert.alert_id}</p>
                <p className="text-xs text-gray-400 mt-0.5">Full alert details</p>
              </div>
              <button
                onClick={() => setDetailsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Student */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Student</p>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  {[
                    ['Name',              selectedAlert.student_name || 'N/A'],
                    ['Student ID',        selectedAlert.student || 'N/A'],
                    ['Classroom',         selectedAlert.classroom_name || 'Not enrolled'],
                    ['Days missed (30d)', `${selectedAlert.days_missed || 0} days`],
                    ['Consecutive',       `${selectedAlert.consecutive_absences || 0} in a row`],
                    ['Full days missed',  `${selectedAlert.full_days_missed?.length || 0} days`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {selectedAlert.full_days_missed?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedAlert.full_days_missed.slice(0, 10).map((date, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ))}
                    {selectedAlert.full_days_missed.length > 10 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        +{selectedAlert.full_days_missed.length - 10} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Missed classes */}
              {selectedAlert.missed_classes_detail?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Missed classes by subject</p>
                  <div className="space-y-2">
                    {selectedAlert.missed_classes_detail.map((subject, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{subject.subject}</p>
                            <p className="text-xs text-gray-400">{subject.classroom}</p>
                          </div>
                          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            {subject.classes_missed} missed
                          </span>
                        </div>
                        {subject.recent_dates?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {subject.recent_dates.map((date, di) => (
                              <span key={di} className="text-xs text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert details */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Alert details</p>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  {[
                    ['Type',        selectedAlert.alert_type],
                    ['Assigned to', selectedAlert.assigned_to_name || 'Unassigned'],
                    ['Subject',     selectedAlert.subject_name || 'N/A'],
                    ['Date',        new Date(selectedAlert.alert_date).toLocaleDateString()],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs text-gray-400">Risk</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full border ${RISK_BADGE[selectedAlert.risk_level] || RISK_BADGE.low}`}>
                      {selectedAlert.risk_level}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full border ${STATUS_BADGE[selectedAlert.status] || STATUS_BADGE.active}`}>
                      {selectedAlert.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {selectedAlert.description && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{selectedAlert.description}</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setDetailsModal(false)}
                className="w-full py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
