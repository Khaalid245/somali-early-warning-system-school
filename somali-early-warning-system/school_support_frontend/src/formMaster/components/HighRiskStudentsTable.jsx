export default function HighRiskStudentsTable({ students, getRiskBadgeColor, onCreateCase }) {
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">High-Risk Students</h3>
        </div>
        <div className="p-12 text-center text-gray-500">No high-risk students</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">High-Risk Students - Detailed Attendance</h3>
        <p className="text-sm text-gray-500">Students requiring immediate intervention</p>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Classroom</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Risk</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Attendance %</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Days Missed</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Late Count</th>
            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.student__student_id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-800">{student.student__full_name}</p>
                  <p className="text-xs text-gray-500">ID: {student.student__student_id}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{student.classroom}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                  {student.risk_level?.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className={`text-lg font-bold ${
                    student.attendance_rate >= 80 ? 'text-green-600' :
                    student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.attendance_rate}%
                  </span>
                  <span className="text-xs text-gray-500">{student.total_sessions} sessions</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-lg font-bold text-red-600">{student.absent_count}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-lg font-bold text-orange-600">{student.late_count}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onCreateCase(student)}
                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                >
                  Create Case
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
