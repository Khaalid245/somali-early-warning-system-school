import { useState, useEffect } from 'react';
import { interventionMeetingApi } from '../../api/interventionApi';
import { showToast } from '../../utils/toast';

export default function InterventionProgressTracker({ meeting, onClose, onUpdate }) {
  const [progressText, setProgressText] = useState('');
  const [newStatus, setNewStatus] = useState(meeting?.status || 'open');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(meeting?.progress_updates || []);

  // Re-fetch meeting detail to get fresh progress_updates after each update
  const refreshHistory = async () => {
    try {
      const res = await interventionMeetingApi.getMeeting(meeting.id);
      setHistory(res.data.progress_updates || []);
    } catch {
      // silently ignore — stale history is better than a crash
    }
  };

  useEffect(() => {
    if (meeting) {
      setHistory(meeting.progress_updates || []);
      setNewStatus(meeting.status || 'open');
    }
  }, [meeting]);

  const handleAddProgress = async () => {
    if (!progressText.trim()) {
      showToast.error('Please enter progress notes');
      return;
    }

    setLoading(true);
    try {
      await interventionMeetingApi.addProgressUpdate({
        meeting: meeting.id,
        update_text: progressText,
      });

      // Update status if changed
      if (newStatus !== meeting.status) {
        await interventionMeetingApi.updateMeeting(meeting.id, {
          status: newStatus,
        });
      }

      showToast.success('Progress updated successfully');
      setProgressText('');
      await refreshHistory();   // re-fetch history inside modal immediately
      onUpdate?.();             // reload parent list
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      improving: 'bg-green-100 text-green-800',
      not_improving: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    };
    return colors[urgency] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Intervention Progress Tracker
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {meeting?.student_name} - {meeting?.student_id_number}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Meeting Summary */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting?.status)}`}>
                  {meeting?.status?.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`text-xs sm:text-sm font-semibold ${getUrgencyColor(meeting?.urgency_level)}`}>
                  {meeting?.urgency_level?.toUpperCase()} URGENCY
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Meeting: {new Date(meeting?.meeting_date).toLocaleDateString()}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">Root Cause</p>
              <p className="font-medium text-gray-800">{meeting?.root_cause?.replace('_', ' ')}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">Action Plan</p>
              <p className="text-sm text-gray-700">{meeting?.action_plan}</p>
            </div>

            {meeting?.follow_up_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Follow-up Date</p>
                <p className={`text-sm font-medium ${meeting?.is_overdue ? 'text-red-600' : 'text-gray-700'}`}>
                  {new Date(meeting?.follow_up_date).toLocaleDateString()}
                  {meeting?.is_overdue && ' (OVERDUE)'}
                </p>
              </div>
            )}
          </div>

          {/* Add Progress Update */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Add Progress Update</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="monitoring">Monitoring</option>
                <option value="improving">Improving</option>
                <option value="not_improving">Not Improving</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Notes
              </label>
              <textarea
                rows={4}
                value={progressText}
                onChange={(e) => setProgressText(e.target.value)}
                placeholder="Document student progress, observations, or next steps..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAddProgress}
              disabled={loading || !progressText.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Saving...' : 'Add Progress Update'}
            </button>
          </div>

          {/* Progress History */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">
              Progress History ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                No progress updates yet
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((update) => (
                  <div key={update.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-800">
                        {update.created_by_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(update.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{update.update_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning for Recurring Issues */}
          {meeting?.progress_count >= 3 && meeting?.status !== 'improving' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> Multiple updates without improvement. Consider escalation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
