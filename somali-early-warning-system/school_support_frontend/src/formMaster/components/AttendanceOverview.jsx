import { useState, useEffect, useContext } from "react";
import api from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";

export default function AttendanceOverview() {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentsWithAttendance();
  }, []);

  const loadStudentsWithAttendance = async () => {
    setLoading(true);
    try {
      // Use dashboard endpoint which already has attendance data
      const res = await api.get("/interventions/dashboard/");
      const studentsData = res.data.high_risk_students || [];
      
      // Calculate daily attendance pattern
      const studentsWithDailyData = studentsData.map(student => {
        const expectedSubjectsPerDay = 7;
        const totalDays = Math.ceil(student.total_sessions / expectedSubjectsPerDay);
        const fullDaysAbsent = Math.floor(student.absent_count / expectedSubjectsPerDay);
        const partialAbsences = student.absent_count % expectedSubjectsPerDay;
        
        return {
          ...student,
          total_days: totalDays,
          full_days_absent: fullDaysAbsent,
          partial_absences: partialAbsences,
          subjects_per_day: expectedSubjectsPerDay
        };
      });
      
      setStudents(studentsWithDailyData);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Student Attendance Overview</h3>
          <p className="text-sm text-gray-600 mt-1">{students.length} students</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Days Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partial Absences</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No students found</td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.student__student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{s.student__student_id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.student__full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.total_days}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-red-600">
                          {s.full_days_absent} {s.full_days_absent > 0 && '🚨'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        {s.partial_absences} subject{s.partial_absences !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-600">{s.late_count}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceColor(s.attendance_rate)}`}>
                          {s.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <div>Class: {s.classroom}</div>
                          <div>Risk: <span className="font-medium">{s.risk_level}</span></div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
