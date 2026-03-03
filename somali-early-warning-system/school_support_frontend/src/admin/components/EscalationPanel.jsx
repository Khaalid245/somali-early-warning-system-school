import { useState } from 'react';
import { AlertTriangle, Clock, User, Calendar, MessageSquare, CheckCircle, XCircle, FileText, Phone, Mail, MapPin } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function EscalationPanel({ cases, onRefresh }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(false);

  const getRiskBadge = (level) => {
    const badges = {
      critical: 'bg-purple-100 text-purple-800 border-purple-300',
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
      unknown: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return badges[level] || badges.unknown;
  };

  const handleAction = async () => {
    if (!selectedCase || !actionType) return;

    setLoading(true);
    try {
      await api.patch(`/interventions/cases/${selectedCase.case_id}/`, {
        status: actionType === 'close' ? 'closed' : 'in_progress',
        resolution_notes: actionNote,
        admin_reviewed: true
      });
      
      showToast.success(`Case #${selectedCase.case_id} ${actionType === 'close' ? 'closed' : 'updated'} successfully`);
      setActionModal(false);
      setActionNote('');
      onRefresh();
    } catch (err) {
      console.error('Action failed:', err);
      showToast.error('Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (caseItem, type) => {
    setSelectedCase(caseItem);
    setActionType(type);
    setActionModal(true);
  };

  const openDetailsModal = (caseItem) => {
    setSelectedCase(caseItem);
    setDetailsModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Escalated Cases</h2>
        </div>
        <div className="text-sm text-gray-600">
          {cases.length} case{cases.length !== 1 ? 's' : ''} need attention
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-lg font-medium">No escalated cases</p>
          <p className="text-sm">All cases are being handled by form masters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((caseItem) => (
            <div 
              key={caseItem.case_id} 
              className={`border-2 rounded-lg p-4 ${caseItem.is_overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} hover:shadow-md transition`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-blue-600">#{caseItem.case_id}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadge(caseItem.risk_level)}`}>
                    {caseItem.risk_level?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {caseItem.is_overdue && (
                    <span className="px-2 py-1 text-xs font-bold text-red-600 bg-red-100 rounded-full border border-red-300">
                      OVERDUE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{caseItem.days_open} days open</span>
                </div>
              </div>

              {/* Student Info */}
              <div className="mb-3">
                <div className="font-semibold text-gray-900 text-base">{caseItem.student_name}</div>
                <div className="text-sm text-gray-600">ID: {caseItem.student_id}</div>
              </div>

              {/* Form Master & Reason */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700"><span className="font-medium">Form Master:</span> {caseItem.form_master}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-700">Escalation Reason:</span>
                    <p className="text-gray-600 mt-1">{caseItem.escalation_reason}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openDetailsModal(caseItem)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition"
                >
                  View Full Details
                </button>
                <button
                  onClick={() => openActionModal(caseItem, 'review')}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                >
                  Review
                </button>
                <button
                  onClick={() => openActionModal(caseItem, 'close')}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition"
                >
                  Close Case
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Case #{selectedCase.case_id}</h3>
                  <p className="text-blue-100 text-sm">Complete Student & Case Details</p>
                </div>
                <button
                  onClick={() => setDetailsModal(false)}
                  className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
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
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Full Name</span>
                      <p className="text-sm font-medium text-gray-900">{selectedCase.student_name}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Student ID</span>
                      <p className="text-sm font-medium text-gray-900">{selectedCase.student_id}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Risk Level</span>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadge(selectedCase.risk_level)}`}>
                        {selectedCase.risk_level?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Days Open</span>
                      <p className="text-sm font-medium text-gray-900">{selectedCase.days_open} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Master Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Form Master Details
                </h4>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{selectedCase.form_master}</p>
                  <p className="text-xs text-gray-600 mt-1">Assigned Form Master</p>
                </div>
              </div>

              {/* Escalation Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Escalation Details
                </h4>
                <div className="bg-red-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Escalation Reason</span>
                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">{selectedCase.escalation_reason}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedCase.status?.toUpperCase()}</p>
                  </div>
                  {selectedCase.is_overdue && (
                    <div className="bg-red-100 border border-red-300 rounded p-2">
                      <p className="text-xs font-bold text-red-700">⚠️ OVERDUE - Requires immediate attention</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Master Notes */}
              {selectedCase.notes && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Form Master Notes
                  </h4>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{selectedCase.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-b-lg flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setDetailsModal(false);
                  openActionModal(selectedCase, 'review');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Review Case
              </button>
              <button
                onClick={() => {
                  setDetailsModal(false);
                  openActionModal(selectedCase, 'close');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Close Case
              </button>
              <button
                onClick={() => setDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-lg">
              <h3 className="text-lg font-bold text-white">
                {actionType === 'close' ? 'Close Case' : 'Review Case'} #{selectedCase?.case_id}
              </h3>
            </div>
            
            <div className="p-4 sm:p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'close' ? 'Resolution Notes' : 'Review Notes'}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Enter your notes..."
              />
            </div>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-b-lg flex gap-3">
              <button
                onClick={handleAction}
                disabled={loading || !actionNote.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setActionModal(false);
                  setActionNote('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
