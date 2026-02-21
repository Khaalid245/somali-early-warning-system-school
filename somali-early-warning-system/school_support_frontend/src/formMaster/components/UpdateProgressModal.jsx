import { useState } from "react";

export default function UpdateProgressModal({ isOpen, onClose, caseData, onUpdate }) {
  const [formData, setFormData] = useState({
    progress_status: caseData?.progress_status || 'no_contact',
    meeting_date: caseData?.meeting_date || new Date().toISOString().split('T')[0],
    meeting_notes: caseData?.meeting_notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate(caseData.case_id, formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Update Progress</h2>
          <p className="text-sm text-gray-600 mt-1">{caseData?.student__full_name} - ID: {caseData?.student__student_id}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Status</label>
            <select
              value={formData.progress_status}
              onChange={(e) => setFormData({...formData, progress_status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="no_contact">No Contact</option>
              <option value="contacted">Contacted</option>
              <option value="improving">Improving</option>
              <option value="not_improving">Not Improving</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date</label>
            <input
              type="date"
              value={formData.meeting_date}
              onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Notes</label>
            <textarea
              value={formData.meeting_notes}
              onChange={(e) => setFormData({...formData, meeting_notes: e.target.value})}
              rows="6"
              placeholder="Document what was discussed, actions taken, student response, next steps..."
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
