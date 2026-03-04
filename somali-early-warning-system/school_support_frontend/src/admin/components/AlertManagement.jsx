import { useState, useEffect } from 'react';
import { AlertCircle, Filter, Download, Search, User, Eye, XCircle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function AlertManagement({ data, onRefresh }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    risk_level: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Build query params for backend filtering
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.risk_level) params.append('risk_level', filters.risk_level);
      if (filters.status) params.append('status', filters.status);
      
      const res = await api.get(`/alerts/?${params.toString()}`);
      setAlerts(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      showToast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  // Reload when filters change
  useEffect(() => {
    loadAlerts();
  }, [filters]);

  // No client-side filtering needed - backend handles it
  const filteredAlerts = alerts;

  const handleExport = () => {
    const csv = [
      ['Alert ID', 'Student', 'Type', 'Risk Level', 'Status', 'Date'].join(','),
      ...filteredAlerts.map(a => [
        a.alert_id,
        a.student_name || 'Unknown',
        a.alert_type,
        a.risk_level,
        a.status,
        new Date(a.alert_date).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast.success('Alerts exported successfully');
  };

  const getRiskBadge = (level) => {
    const badges = {
      critical: 'bg-purple-100 text-purple-800 border-purple-300',
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return badges[level] || badges.low;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      escalated: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges.active;
  };

  const openDetailsModal = (alert) => {
    setSelectedAlert(alert);
    setDetailsModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Alert Management</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Student name or ID..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
          <select
            value={filters.risk_level}
            onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFilters({ risk_level: '', status: '', search: '' })}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No alerts found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div key={alert.alert_id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-blue-600">#{alert.alert_id}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadge(alert.risk_level)}`}>
                    {alert.risk_level?.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(alert.status)}`}>
                    {alert.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => openDetailsModal(alert)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Student</span>
                  <p className="text-sm font-medium text-gray-900">
                    {alert.student_name || 'Unknown Student'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Classroom</span>
                  <p className="text-sm text-gray-700">{alert.classroom_name || 'Not Enrolled'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Alert Type</span>
                  <p className="text-sm text-gray-700 capitalize">{alert.alert_type}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Subject</span>
                  <p className="text-sm text-gray-700">{alert.subject_name || 'General'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Date</span>
                  <p className="text-sm text-gray-700">{new Date(alert.alert_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Days Missed (30d)</span>
                  <p className="text-sm font-bold text-red-600">{alert.days_missed || 0}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Subject Classes Missed</span>
                  <p className="text-sm font-bold text-orange-600">{alert.subject_missed || 0}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Assigned To</span>
                  <p className="text-sm text-gray-700">{alert.assigned_to_name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 sm:p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Alert #{selectedAlert.alert_id}</h3>
                  <p className="text-orange-100 text-sm">Complete Alert & Student Details</p>
                </div>
                <button
                  onClick={() => setDetailsModal(false)}
                  className="text-white hover:bg-orange-800 rounded-lg p-2 transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Student Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Student Information
                </h4>
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Full Name</span>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAlert.student_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Student ID</span>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAlert.student || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Classroom</span>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAlert.classroom_name || 'Not Enrolled'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Total Days Missed (30d)</span>
                      <p className="text-sm font-bold text-red-600">
                        {selectedAlert.days_missed || 0} days
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Subject</span>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAlert.subject_name || 'General'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Subject Classes Missed (30d)</span>
                      <p className="text-sm font-bold text-orange-600">
                        {selectedAlert.subject_missed || 0} classes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Alert Details
                </h4>
                <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Alert Type</span>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedAlert.alert_type}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Risk Level</span>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadge(selectedAlert.risk_level)}`}>
                        {selectedAlert.risk_level?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedAlert.status)}`}>
                        {selectedAlert.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Alert Date</span>
                      <p className="text-sm text-gray-900">{new Date(selectedAlert.alert_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Assigned To</span>
                      <p className="text-sm text-gray-900">{selectedAlert.assigned_to_name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Subject</span>
                      <p className="text-sm text-gray-900">{selectedAlert.subject_name || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedAlert.description && (
                    <div className="pt-2 border-t border-orange-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Description</span>
                      <p className="text-sm text-gray-900 mt-1 leading-relaxed">{selectedAlert.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-b-lg">
              <button
                onClick={() => setDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
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
