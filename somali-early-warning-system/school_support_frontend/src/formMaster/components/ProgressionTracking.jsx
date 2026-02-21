import { useState } from "react";
import UpdateProgressModal from "./UpdateProgressModal";
import EscalateToAdminModal from "./EscalateToAdminModal";

export default function ProgressionTracking({ cases, getRiskBadgeColor, onUpdateProgress, onEscalate, isLoading }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [escalateCase, setEscalateCase] = useState(null);
  const improving = cases?.filter(c => c.progress_status === 'improving') || [];
  const notImproving = cases?.filter(c => c.progress_status === 'not_improving') || [];
  const noContact = cases?.filter(c => c.progress_status === 'no_contact') || [];
  const resolved = cases?.filter(c => c.progress_status === 'resolved') || [];

  const getProgressBadge = (status) => {
    const badges = {
      improving: 'bg-green-100 text-green-800',
      not_improving: 'bg-red-100 text-red-800',
      no_contact: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      resolved: 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{improving.length}</div>
          <div className="text-sm text-green-600">Improving</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">{notImproving.length}</div>
          <div className="text-sm text-red-600">Not Improving</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-700">{noContact.length}</div>
          <div className="text-sm text-gray-600">No Contact Yet</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">{resolved.length}</div>
          <div className="text-sm text-purple-600">Resolved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-semibold text-green-800">✓ Students Improving ({improving.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {improving.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No improving students yet</div>
            ) : (
              improving.map(c => (
                <div key={c.case_id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{c.student__full_name}</div>
                      <div className="text-sm text-gray-600">Classroom: {c.classroom}</div>
                      <div className="text-xs text-gray-500 mt-1">Last meeting: {c.meeting_date || 'Not recorded'}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskBadgeColor(c.student_risk_level)}`}>
                      {c.student_risk_level}
                    </span>
                  </div>
                  {c.meeting_notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{c.meeting_notes}</div>
                  )}
                  <button
                    onClick={() => setSelectedCase(c)}
                    className="mt-2 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                    disabled={isLoading && isLoading(`progress-${c.case_id}`)}
                  >
                    {isLoading && isLoading(`progress-${c.case_id}`) ? 'Updating...' : 'Update Progress →'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <h3 className="font-semibold text-red-800">⚠ Students Not Improving ({notImproving.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {notImproving.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No students flagged as not improving</div>
            ) : (
              notImproving.map(c => (
                <div key={c.case_id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{c.student__full_name}</div>
                      <div className="text-sm text-gray-600">Classroom: {c.classroom}</div>
                      <div className="text-xs text-gray-500 mt-1">Last meeting: {c.meeting_date || 'Not recorded'}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskBadgeColor(c.student_risk_level)}`}>
                      {c.student_risk_level}
                    </span>
                  </div>
                  {c.meeting_notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{c.meeting_notes}</div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      disabled={isLoading && isLoading(`progress-${c.case_id}`)}
                    >
                      {isLoading && isLoading(`progress-${c.case_id}`) ? 'Updating...' : 'Update Progress →'}
                    </button>
                    <button
                      onClick={() => setEscalateCase(c)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      disabled={isLoading && isLoading(`escalate-${c.case_id}`)}
                    >
                      {isLoading && isLoading(`escalate-${c.case_id}`) ? 'Escalating...' : '🚨 Escalate to Admin'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">All Cases Progress Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Classroom</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Last Meeting</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Status</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No intervention cases</td>
                </tr>
              ) : (
                cases?.map(c => (
                  <tr key={c.case_id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-3 text-sm font-medium text-gray-900">{c.student__full_name}</td>
                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{c.classroom}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRiskBadgeColor(c.student_risk_level)}`}>
                        {c.student_risk_level}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getProgressBadge(c.progress_status)}`}>
                        {c.progress_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{c.meeting_date || 'Not recorded'}</td>
                    <td className="px-2 sm:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{c.status}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 whitespace-nowrap"
                          disabled={isLoading && isLoading(`progress-${c.case_id}`)}
                        >
                          {isLoading && isLoading(`progress-${c.case_id}`) ? 'Updating...' : 'Update →'}
                        </button>
                        {c.progress_status === 'not_improving' && (
                          <button
                            onClick={() => setEscalateCase(c)}
                            className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 whitespace-nowrap"
                            disabled={isLoading && isLoading(`escalate-${c.case_id}`)}
                          >
                            {isLoading && isLoading(`escalate-${c.case_id}`) ? 'Escalating...' : '🚨 Escalate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UpdateProgressModal
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        caseData={selectedCase}
        onUpdate={onUpdateProgress}
      />

      <EscalateToAdminModal
        isOpen={!!escalateCase}
        onClose={() => setEscalateCase(null)}
        caseData={escalateCase}
        onEscalate={onEscalate}
      />
    </div>
  );
}
