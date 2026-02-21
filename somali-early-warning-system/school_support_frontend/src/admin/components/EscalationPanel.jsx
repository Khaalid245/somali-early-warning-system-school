import { useState } from 'react';
import { AlertTriangle, Clock, User, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function EscalationPanel({ cases, onRefresh }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [actionModal, setActionModal] = useState(false);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Escalation Control Panel</h2>
        </div>
        <div className="text-sm text-gray-600">
          {cases.length} case{cases.length !== 1 ? 's' : ''} requiring admin action
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-lg font-medium">No escalated cases</p>
          <p className="text-sm">All cases are being handled at the form master level</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Case ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Form Master</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Open</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((caseItem) => (
                <tr 
                  key={caseItem.case_id} 
                  className={`hover:bg-gray-50 transition ${caseItem.is_overdue ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-blue-600">#{caseItem.case_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{caseItem.student_name}</div>
                      <div className="text-xs text-gray-500">{caseItem.student_id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{caseItem.form_master}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadge(caseItem.risk_level)}`}>
                      {caseItem.risk_level?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${caseItem.is_overdue ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${caseItem.is_overdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {caseItem.days_open} days
                      </span>
                      {caseItem.is_overdue && (
                        <span className="text-xs text-red-600 font-semibold">OVERDUE</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 max-w-xs truncate" title={caseItem.escalation_reason}>
                      {caseItem.escalation_reason}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openActionModal(caseItem, 'review')}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => openActionModal(caseItem, 'close')}
                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'close' ? 'Close Case' : 'Review Case'} #{selectedCase?.case_id}
            </h3>
            
            <div className="mb-4">
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

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={loading || !actionNote.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setActionModal(false);
                  setActionNote('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
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
