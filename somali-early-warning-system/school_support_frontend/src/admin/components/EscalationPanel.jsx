import { useState } from 'react';
import { Clock, User, MessageSquare, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

const RISK_BADGE = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-amber-50 text-amber-700 border-amber-200',
  medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:      'bg-green-50 text-green-700 border-green-200',
  unknown:  'bg-gray-50 text-gray-600 border-gray-200',
};

const RISK_ICON = {
  critical: AlertCircle,
  high:     AlertTriangle,
  medium:   AlertCircle,
  low:      CheckCircle,
  unknown:  AlertCircle,
};

export default function EscalationPanel({ cases, onRefresh }) {
  const [selectedCase, setSelectedCase]   = useState(null);
  const [actionModal, setActionModal]     = useState(false);
  const [detailsModal, setDetailsModal]   = useState(false);
  const [actionType, setActionType]       = useState('');
  const [actionNote, setActionNote]       = useState('');
  const [loading, setLoading]             = useState(false);

  const handleAction = async () => {
    if (!selectedCase || !actionType) return;
    setLoading(true);
    try {
      await api.patch(`/interventions/${selectedCase.case_id}/`, {
        status: actionType === 'close' ? 'closed' : 'in_progress',
        resolution_notes: actionNote,
        admin_reviewed: true,
      });
      showToast.success(`Case #${selectedCase.case_id} ${actionType === 'close' ? 'closed' : 'updated'}`);
      setActionModal(false);
      setDetailsModal(false);
      setActionNote('');
      setSelectedCase(null);
      onRefresh();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const openAction  = (c, type) => { setSelectedCase(c); setActionType(type); setActionModal(true); };
  const openDetails = (c)       => { setSelectedCase(c); setDetailsModal(true); };

  const overdue = cases.filter(c => c.is_overdue).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Cases escalated to admin</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cases.length} case{cases.length !== 1 ? 's' : ''}
            {overdue > 0 && <span className="text-red-500 ml-2">· {overdue} overdue</span>}
          </p>
        </div>
      </div>

      {/* Table */}
      {cases.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm text-gray-500">No escalated cases</p>
          <p className="text-xs text-gray-400 mt-1">All cases are being handled by form masters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Student</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Form master</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Risk</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Open</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">Reason</th>
                <th className="px-4 py-2.5 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cases.map((c) => {
                const RiskIcon = RISK_ICON[c.risk_level] || RISK_ICON.unknown;
                return (
                  <tr
                    key={c.case_id}
                    className={`hover:bg-gray-50 transition-colors ${c.is_overdue ? 'bg-red-50/40' : ''}`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                      {c.case_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.student_name}</p>
                          <p className="text-xs text-gray-400">ID: {c.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {c.form_master}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${RISK_BADGE[c.risk_level] || RISK_BADGE.unknown}`}>
                        <RiskIcon className="w-3 h-3" />
                        {c.risk_level || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`flex items-center gap-1 text-xs ${c.is_overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        <Clock className="w-3 h-3" />
                        {c.days_open}d
                        {c.is_overdue && <span className="ml-1 text-red-400">overdue</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell max-w-[200px]">
                      <p className="truncate">{c.escalation_reason || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDetails(c)}
                          className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openAction(c, 'close')}
                          className="px-2.5 py-1 text-xs text-white bg-gray-800 rounded-md hover:bg-gray-700 transition"
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && selectedCase && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
          <div className="bg-white rounded-lg max-w-lg w-full border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Case #{selectedCase.case_id}</p>
                <p className="text-xs text-gray-400 mt-0.5">Escalated case details</p>
              </div>
              <button
                onClick={() => setDetailsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Student */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                {[
                  ['Student',    selectedCase.student_name],
                  ['Student ID', selectedCase.student_id],
                  ['Risk level', selectedCase.risk_level],
                  ['Days open',  `${selectedCase.days_open} days${selectedCase.is_overdue ? ' (overdue)' : ''}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>

              {/* Form master */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Form master</p>
                <p className="text-sm text-gray-800">{selectedCase.form_master}</p>
              </div>

              {/* Escalation reason */}
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Escalation reason
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedCase.escalation_reason || 'No reason provided'}
                </p>
              </div>

              {/* Notes */}
              {selectedCase.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedCase.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => { setDetailsModal(false); openAction(selectedCase, 'review'); }}
                className="flex-1 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
              >
                Add note
              </button>
              <button
                onClick={() => { setDetailsModal(false); openAction(selectedCase, 'close'); }}
                className="flex-1 py-2 text-sm text-white bg-gray-800 rounded-md hover:bg-gray-700 transition"
              >
                Close case
              </button>
              <button
                onClick={() => setDetailsModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && selectedCase && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
          <div className="bg-white rounded-lg max-w-md w-full border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {actionType === 'close' ? 'Close case' : 'Add note'} — #{selectedCase.case_id}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedCase.student_name}</p>
            </div>

            <div className="p-5">
              <label className="block text-xs text-gray-500 mb-1.5">
                {actionType === 'close' ? 'Resolution notes' : 'Notes'}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 resize-none"
                rows={4}
                placeholder="Enter your notes..."
              />
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleAction}
                disabled={loading || !actionNote.trim()}
                className="flex-1 py-2 text-sm text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setActionModal(false); setActionNote(''); }}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition"
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
