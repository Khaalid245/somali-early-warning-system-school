import { useState, useEffect } from "react";
import api from "../../api/apiClient";

export default function DailyAttendanceMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const loadDailyAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/daily-monitor/?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load daily attendance", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'present') return 'bg-green-100 text-green-800';
    if (status === 'absent') return 'bg-red-100 text-red-800';
    if (status === 'late') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load data</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Attendance Monitor</h2>
          <p className="text-gray-600">{data.classroom} - {data.total_students} students</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Full Day Absent Alert */}
      {data.full_day_absent_students.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🚨</span>
            <div>
              <h3 className="text-lg font-bold text-red-800">Full Day Absences</h3>
              <p className="text-sm text-red-600">{data.full_day_absent_students.length} student(s) missed all {data.total_subjects_today} subjects today</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.full_day_absent_students.map(s => (
              <div key={s.student_id} className="bg-white p-3 rounded border border-red-200">
                <div className="font-semibold text-gray-900">{s.student_name}</div>
                <div className="text-sm text-red-600">ID: {s.student_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject-wise Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Attendance by Subject</h3>
          <p className="text-sm text-gray-600">{data.total_subjects_today} subjects taught today</p>
        </div>
        <div className="divide-y divide-gray-200">
          {data.subject_summaries.map(subject => (
            <div key={subject.session_id} className="p-4 hover:bg-gray-50">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedSubject(expandedSubject === subject.session_id ? null : subject.session_id)}
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{subject.subject_name}</h4>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600">✓ {subject.present_count} Present</span>
                    <span className="text-red-600">✗ {subject.absent_count} Absent</span>
                    <span className="text-yellow-600">⏰ {subject.late_count} Late</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getAttendanceColor(subject.attendance_rate)}`}>
                    {subject.attendance_rate}%
                  </div>
                  <div className="text-xs text-gray-500">{subject.present_count}/{subject.total_students}</div>
                </div>
              </div>
              
              {/* Expanded - Show absent students */}
              {expandedSubject === subject.session_id && subject.absent_students.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Absent Students:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {subject.absent_students.map(s => (
                      <div key={s.student_id} className="text-sm bg-red-50 px-3 py-2 rounded">
                        {s.student_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Student Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Per-Student Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Student</th>
                {data.subject_summaries.map(s => (
                  <th key={s.session_id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {s.subject_name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.student_breakdown.map(student => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {student.student_name}
                  </td>
                  {student.subjects.map((subj, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subj.status)}`}>
                        {subj.status === 'present' && '✓'}
                        {subj.status === 'absent' && '✗'}
                        {subj.status === 'late' && '⏰'}
                        {subj.status === 'not_recorded' && '-'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => window.open(`/attendance-report/${student.student_id}`, '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      📊 Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
