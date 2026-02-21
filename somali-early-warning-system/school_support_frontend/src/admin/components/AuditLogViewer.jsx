import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Clock, User } from 'lucide-react';
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

  const getActionBadge = (action) => {
    const badges = {
      case_created: 'bg-blue-100 text-blue-800',
      case_closed: 'bg-green-100 text-green-800',
      case_reassigned: 'bg-purple-100 text-purple-800',
      alert_escalated: 'bg-red-100 text-red-800',
      alert_status_updated: 'bg-yellow-100 text-yellow-800',
      alert_reassigned: 'bg-orange-100 text-orange-800',
      alert_archived: 'bg-gray-100 text-gray-800',
      risk_spike: 'bg-red-100 text-red-800'
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      form_master: 'bg-blue-100 text-blue-800 border-blue-300',
      teacher: 'bg-green-100 text-green-800 border-green-300',
      system: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return badges[role] || badges.system;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Audit Log Viewer</h2>
        </div>
        <div className="text-sm text-gray-600">
          {pagination.total_count} total log{pagination.total_count !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="case_created">Case Created</option>
            <option value="case_closed">Case Closed</option>
            <option value="case_reassigned">Case Reassigned</option>
            <option value="alert_escalated">Alert Escalated</option>
            <option value="alert_status_updated">Alert Status Updated</option>
            <option value="alert_reassigned">Alert Reassigned</option>
            <option value="alert_archived">Alert Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getActionBadge(log.action)}`}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRoleBadge(log.user_role)}`}>
                        {log.user_role.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{log.user}</span>
                    </div>
                    <p className="text-sm text-gray-700">{log.description}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          View metadata
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {logs.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No audit logs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
