import { useState } from 'react';
import { interventionMeetingApi } from '../../api/interventionApi';
import { showToast } from '../../utils/toast';

export default function RecordMeetingModal({ student, students = [], onClose, onSuccess }) {
  console.log('RecordMeetingModal - students:', students, 'count:', students.length);
  
  const [selectedStudent, setSelectedStudent] = useState(student?.student_id || '');
  const [formData, setFormData] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    absence_reason: '',
    root_cause: 'health',
    intervention_notes: '',
    action_plan: '',
    follow_up_date: '',
    urgency_level: 'medium',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      showToast.error('Please select a student');
      return;
    }
    
    setLoading(true);

    try {
      await interventionMeetingApi.createMeeting({
        ...formData,
        student: selectedStudent,
      });
      showToast.success('Meeting recorded successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.student?.[0] ||
                       error.response?.data?.non_field_errors?.[0] ||
                       'Failed to record meeting';
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentStudent = student || students.find(s => s.student_id === selectedStudent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Record Intervention Meeting
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection */}
          {!student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student *
              </label>
              {students.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 bg-yellow-50 rounded-lg">
                  No students available. Please ensure students are enrolled in the system.
                </div>
              ) : (
                <select
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.full_name} ({s.student_id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Student Info */}
          {currentStudent && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-semibold text-gray-800">{currentStudent.full_name}</p>
              <p className="text-sm text-gray-500">ID: {currentStudent.student_id}</p>
            </div>
          )}

          {/* Meeting Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Date *
            </label>
            <input
              type="date"
              required
              value={formData.meeting_date}
              onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Absence Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Absence *
            </label>
            <textarea
              required
              rows={3}
              value={formData.absence_reason}
              onChange={(e) => setFormData({ ...formData, absence_reason: e.target.value })}
              placeholder="Document what the student said about their absence..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Cause Category *
            </label>
            <select
              required
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="health">Health Issue</option>
              <option value="family">Family Issue</option>
              <option value="academic">Academic Difficulty</option>
              <option value="financial">Financial Issue</option>
              <option value="behavioral">Behavioral Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Intervention Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervention Notes *
            </label>
            <textarea
              required
              rows={4}
              value={formData.intervention_notes}
              onChange={(e) => setFormData({ ...formData, intervention_notes: e.target.value })}
              placeholder="Detailed notes about the discussion and observations..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Plan / Follow-up Strategy *
            </label>
            <textarea
              required
              rows={4}
              value={formData.action_plan}
              onChange={(e) => setFormData({ ...formData, action_plan: e.target.value })}
              placeholder="Define specific actions and next steps..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Follow-up Date & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <select
                required
                value={formData.urgency_level}
                onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
