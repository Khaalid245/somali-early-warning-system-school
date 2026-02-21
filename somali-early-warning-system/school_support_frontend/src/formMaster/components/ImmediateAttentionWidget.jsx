export default function ImmediateAttentionWidget({ students, getRiskBadgeColor }) {
  if (!students || students.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 mb-8">
      <div className="p-6 border-b border-red-200 bg-red-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <h3 className="text-lg font-semibold text-red-900">Students Needing Immediate Attention</h3>
        </div>
        <p className="text-sm text-red-700 mt-1">Critical risk with no recent intervention</p>
      </div>
      <div className="divide-y divide-gray-200">
        {students.map((student) => (
          <div key={student.student__student_id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold text-gray-900">{student.student__full_name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                    {student.risk_level?.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    Priority: {student.priority_score}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>📍 {student.classroom}</span>
                  <span>📊 {student.attendance_rate}% attendance</span>
                  {!student.has_intervention && <span className="text-red-600 font-medium">⚠️ No intervention yet</span>}
                  {student.days_since_followup > 7 && <span className="text-orange-600 font-medium">⏰ {student.days_since_followup} days overdue</span>}
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
                Take Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
