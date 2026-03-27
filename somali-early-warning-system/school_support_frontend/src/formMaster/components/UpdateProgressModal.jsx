import { useState } from "react";

export default function UpdateProgressModal({ isOpen, onClose, caseData, onUpdate }) {
  const [progressStatus, setProgressStatus] = useState(caseData?.progress_status || 'no_contact');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = {
      progress_status: progressStatus,
      meeting_notes: meetingNotes,
      meeting_date: new Date().toISOString().split('T')[0]
    };
    
    await onUpdate(caseData.case_id, formData);
    setLoading(false);
    setMeetingNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Update Progress</h2>
          <p className="text-sm text-gray-600 mt-1">{caseData?.student__full_name} - Case #{caseData?.case_id}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Status <span className="text-red-500">*</span>
            </label>
            <select
              value={progressStatus}
              onChange={(e) => setProgressStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="no_contact">No Contact Yet</option>
              <option value="contacted">Student Contacted</option>
              <option value="improving">Showing Improvement</option>
              <option value="not_improving">Not Improving</option>
              <option value="resolved">Issue Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              rows="5"
              placeholder="Describe what happened in the meeting, student's response, actions taken, next steps..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Progress'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}