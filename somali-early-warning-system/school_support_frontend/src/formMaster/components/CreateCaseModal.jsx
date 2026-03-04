import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function CreateCaseModal({ student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    intervention_type: 'counseling',
    priority: 'medium',
    follow_up_date: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      showToast.error('Description is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/interventions/', {
        student: student.student__student_id,
        description: formData.description,
        intervention_type: formData.intervention_type,
        priority: formData.priority,
        follow_up_date: formData.follow_up_date || null,
        status: 'open',
      });
      
      showToast.success('Intervention case created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Create Intervention Case</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Student: {student?.student__full_name} (ID: {student?.student__student_id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Student Info Card */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-600">Risk Level:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  student?.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                  student?.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {student?.risk_level?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Attendance Rate:</span>
                <span className="ml-2 font-semibold">{student?.attendance_rate}%</span>
              </div>
              <div>
                <span className="text-gray-600">Days Missed:</span>
                <span className="ml-2 font-semibold text-red-600">{student?.absent_count}</span>
              </div>
              <div>
                <span className="text-gray-600">Classroom:</span>
                <span className="ml-2 font-semibold">{student?.classroom}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Case Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the concerns and reasons for intervention..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Intervention Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Intervention Type
            </label>
            <select
              value={formData.intervention_type}
              onChange={(e) => setFormData({ ...formData, intervention_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="counseling">Counseling</option>
              <option value="academic_support">Academic Support</option>
              <option value="behavioral">Behavioral Intervention</option>
              <option value="attendance">Attendance Monitoring</option>
              <option value="parent_meeting">Parent Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
