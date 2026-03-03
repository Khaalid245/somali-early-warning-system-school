import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Clock, User, Eye } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import { formatDate } from '../utils/helpers';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await api.get(`/dashboard/admin/audit-logs/?${params}`);
      setLogs(response.data.logs);
      setPagination({
        page: response.data.page,
        total_pages: response.data.total_pages,
        total_count: response.data.total_count
      });
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      showToast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionInfo = (action) => {
    const actions = {
      case_created: { color: 'bg-blue-100 text-blue-800', emoji: '🆕', label: 'Case Created' },
      case_closed: { color: 'bg-green-100 text-green-800', emoji: '✅', label: 'Case Closed' },
      case_reassigned: { color: 'bg-purple-100 text-purple-800', emoji: '🔄', label: 'Case Reassigned' },
      alert_escalated: { color: 'bg-red-100 text-red-800', emoji: '🚨', label: 'Alert Escalated' },
      alert_status_updated: { color: 'bg-yellow-100 text-yellow-800', emoji: '✏️', label: 'Alert Updated' },
      alert_reassigned: { color: 'bg-orange-100 text-orange-800', emoji: '🔄', label: 'Alert Reassigned' },
      alert_archived: { color: 'bg-gray-100 text-gray-800', emoji: '📦', label: 'Alert Archived' },
      user_created: { color: 'bg-blue-100 text-blue-800', emoji: '👤', label: 'User Created' },
      user_disabled: { color: 'bg-red-100 text-red-800', emoji: '🚫', label: 'User Disabled' },
      classroom_created: { color: 'bg-green-100 text-green-800', emoji: '🏫', label: 'Classroom Created' },
      student_enrolled: { color: 'bg-blue-100 text-blue-800', emoji: '🎓', label: 'Student Enrolled' }
    };
    return actions[action] || { color: 'bg-gray-100 text-gray-800', emoji: '📝', label: action.replace(/_/g, ' ') };
  };

  const getRoleInfo = (role) => {
    const roles = {
      admin: { color: 'bg-purple-100 text-purple-800', emoji: '👑', label: 'Admin' },
      form_master: { color: 'bg-blue-100 text-blue-800', emoji: '👨‍🏫', label: 'Form Master' },
      teacher: { color: 'bg-green-100 text-green-800', emoji: '👩‍🏫', label: 'Teacher' },
      system: { color: 'bg-gray-100 text-gray-800', emoji: '🤖', label: 'System' }
    };
    return roles[role] || roles.system;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Explanation */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-white flex-shrink-0" />
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Activity History</h2>
            <p className="text-purple-100 text-xs sm:text-sm">See who did what and when</p>
          </div>
        </div>
        <div className="bg-purple-800 bg-opacity-30 rounded-lg p-3 text-white text-xs sm:text-sm">
          <p className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🔒</span>
            <span>This page tracks all actions in the system for security and legal compliance. Every change is recorded.</span>
          </p>
        </div>
      </div>

      {/* Why This Matters */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Why This Is Important
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">⚖️</span>
            <div>
              <strong>Legal Requirement:</strong> Schools must track who accesses student data (FERPA law)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🔍</span>
            <div>
              <strong>Find Problems:</strong> See who changed something if there's a mistake
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🔒</span>
            <div>
              <strong>Security:</strong> Detect if someone is doing something they shouldn't
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">📊</span>
            <div>
              <strong>Accountability:</strong> Everyone knows their actions are recorded
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          Filter Activities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">What Happened</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Actions</option>
              <option value="case_created">Case Created</option>
              <option value="case_closed">Case Closed</option>
              <option value="case_reassigned">Case Reassigned</option>
              <option value="alert_escalated">Alert Escalated</option>
              <option value="user_created">User Created</option>
              <option value="classroom_created">Classroom Created</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ action: '', user_id: '', date_from: '', date_to: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Recent Activities</h3>
          <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {pagination.total_count} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-base font-medium">No activities found</p>
            <p className="text-sm">Try changing your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const actionInfo = getActionInfo(log.action);
              const roleInfo = getRoleInfo(log.user_role);
              
              return (
                <div key={log.id} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Action & Role Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${actionInfo.color} flex items-center gap-1`}>
                          <span>{actionInfo.emoji}</span>
                          <span>{actionInfo.label}</span>
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${roleInfo.color} flex items-center gap-1`}>
                          <span>{roleInfo.emoji}</span>
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>

                      {/* Who & When */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{log.user}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>

                      {/* What Happened */}
                      <p className="text-sm text-gray-700 leading-relaxed">{log.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.total_pages}
              className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
