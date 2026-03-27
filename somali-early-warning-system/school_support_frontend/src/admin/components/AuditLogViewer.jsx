import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Clock, User, Eye, FileText } from 'lucide-react';
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
      case_created: { color: 'bg-blue-50 text-blue-800 border border-blue-200', label: 'Case Created' },
      case_closed: { color: 'bg-green-50 text-green-800 border border-green-200', label: 'Case Closed' },
      case_reassigned: { color: 'bg-purple-50 text-purple-800 border border-purple-200', label: 'Case Reassigned' },
      alert_escalated: { color: 'bg-red-50 text-red-800 border border-red-200', label: 'Alert Escalated' },
      alert_status_updated: { color: 'bg-yellow-50 text-yellow-800 border border-yellow-200', label: 'Alert Updated' },
      alert_reassigned: { color: 'bg-orange-50 text-orange-800 border border-orange-200', label: 'Alert Reassigned' },
      alert_archived: { color: 'bg-gray-50 text-gray-800 border border-gray-200', label: 'Alert Archived' },
      user_created: { color: 'bg-blue-50 text-blue-800 border border-blue-200', label: 'User Created' },
      user_disabled: { color: 'bg-red-50 text-red-800 border border-red-200', label: 'User Disabled' },
      classroom_created: { color: 'bg-green-50 text-green-800 border border-green-200', label: 'Classroom Created' },
      student_enrolled: { color: 'bg-blue-50 text-blue-800 border border-blue-200', label: 'Student Enrolled' }
    };
    return actions[action] || { color: 'bg-gray-50 text-gray-800 border border-gray-200', label: action.replace(/_/g, ' ') };
  };

  const getRoleInfo = (role) => {
    const roles = {
      admin: { color: 'bg-gray-50 text-gray-700 border border-gray-200', label: 'Admin' },
      form_master: { color: 'bg-green-50 text-green-800 border border-green-200', label: 'Form Master' },
      teacher: { color: 'bg-green-50 text-green-800 border border-green-200', label: 'Teacher' },
      system: { color: 'bg-gray-50 text-gray-700 border border-gray-200', label: 'System' }
    };
    return roles[role] || roles.system;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Activity History</h2>
            <p className="text-gray-600 text-sm">Track all system actions for security and compliance</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="flex items-start gap-2 text-sm text-green-800">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>This page tracks all actions in the system for security and legal compliance. Every change is recorded and stored for 7 years as required by FERPA.</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-green-600" />
          Filter Activities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-green-600"
              style={{ boxShadow: 'none' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-green-600"
              style={{ boxShadow: 'none' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-green-600"
              style={{ boxShadow: 'none' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ action: '', user_id: '', date_from: '', date_to: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            {pagination.total_count} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const actionInfo = getActionInfo(log.action);
              const roleInfo = getRoleInfo(log.user_role);
              
              return (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 transition-colors" style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Action & Role Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>

                      {/* Who & When */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{log.user}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.total_pages}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
