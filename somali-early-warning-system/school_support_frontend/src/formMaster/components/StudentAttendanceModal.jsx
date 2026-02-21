import { useState, useEffect } from "react";
import api from "../../api/apiClient";

export default function StudentAttendanceModal({ isOpen, onClose, student }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadHistory();
    }
  }, [isOpen, student]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/`);
      const sessions = res.data.results || [];
      
      const studentRecords = [];
      sessions.forEach(session => {
        session.records?.forEach(record => {
          if (record.student === student.student_id) {
            studentRecords.push({
              ...record,
              session: {
                attendance_date: session.attendance_date,
                subject_name: session.subject_name
              }
            });
          }
        });
      });
      
      setHistory(studentRecords);
    } catch (err) {
      console.error("Failed to load attendance history", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {student?.full_name} (ID: {student?.student_id})
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-green-600">✓ Present: {student?.present_count}</span>
            <span className="text-red-600">✗ Absent: {student?.absent_count}</span>
            <span className="text-yellow-600">⏰ Late: {student?.late_count}</span>
            <span className="text-gray-600">Rate: {student?.attendance_rate}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(record.session?.attendance_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.session?.subject_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
