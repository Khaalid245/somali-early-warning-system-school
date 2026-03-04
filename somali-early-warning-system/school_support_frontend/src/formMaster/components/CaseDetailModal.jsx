import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function CaseDetailModal({ caseId, onClose, onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    meeting_notes: '',
    progress_status: '',
    follow_up_date: '',
    resolution_notes: '',
  });

  useEffect(() => {
    loadCaseDetails();
  }, [caseId]);

  const loadCaseDetails = async () => {
    try {
      const res = await api.get(`/interventions/${caseId}/`);
      setCaseData(res.data);
      setFormData({
        status: res.data.status || '',
        meeting_notes: res.data.meeting_notes || '',
        progress_status: res.data.progress_status || '',
        follow_up_date: res.data.follow_up_date || '',
        resolution_notes: res.data.resolution_notes || '',
      });
    } catch (error) {
      if (error.response?.status === 404) {
        showToast.error('Case not found or has been deleted');
      } else {
        showToast.error('Failed to load case details');
      }
      console.error(error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.status === 'closed' && !formData.resolution_notes) {
      showToast.error('Resolution notes are required to close a case');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/interventions/${caseId}/`, {
        ...formData,
        version: caseData.version, // For optimistic locking
      });
      
      showToast.success('Case updated successfully');
      onUpdate?.();
      onClose();
    } catch (error) {
      if (error.response?.status === 409) {
        showToast.error('Case was modified by another user. Please refresh.');
      } else {
        showToast.error(error.response?.data?.error || 'Failed to update case');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEscalate = async () => {
    if (!confirm('Are you sure you want to escalate this case to admin?')) return;
    
    setSaving(true);
    try {
      await api.patch(`/interventions/${caseId}/`, {
        status: 'escalated_to_admin',
        version: caseData.version,
      });
      
      showToast.success('Case escalated to admin');
      onUpdate?.();
      onClose();
    } catch (error) {
      showToast.error('Failed to escalate case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Case #{caseData.case_id}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Student: {caseData.student_name} | Created: {new Date(caseData.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Case Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Student:</span>
              <span className="ml-2 font-semibold">{caseData.student_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Classroom:</span>
              <span className="ml-2 font-semibold">{caseData.classroom || 'Not Enrolled'}</span>
            </div>
            <div>
              <span className="text-gray-600">Risk Level:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                caseData.student_risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                caseData.student_risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                caseData.student_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {caseData.student_risk_level?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Alert Type:</span>
              <span className="ml-2 font-semibold">{caseData.alert_type || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Case Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_parent">Awaiting Parent</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Progress Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Progress Status
            </label>
            <select
              value={formData.progress_status}
              onChange={(e) => setFormData({ ...formData, progress_status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Not Set</option>
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
              <option value="no_change">No Change</option>
            </select>
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meeting Notes
            </label>
            <textarea
              value={formData.meeting_notes}
              onChange={(e) => setFormData({ ...formData, meeting_notes: e.target.value })}
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes from meetings or observations..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.meeting_notes.length}/2000 characters
            </p>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Next Follow-up Date
            </label>
            <input
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Resolution Notes (shown when closing) */}
          {formData.status === 'closed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resolution Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.resolution_notes}
                onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe how the case was resolved..."
                required
              />
            </div>
          )}

          {/* Warning for escalated cases */}
          {caseData.status === 'escalated_to_admin' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Case Escalated to Admin</p>
                <p className="text-sm text-red-700 mt-1">
                  This case has been escalated and is now under admin review.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {caseData.status !== 'escalated_to_admin' && caseData.status !== 'closed' && (
                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={saving}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                >
                  Escalate to Admin
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
