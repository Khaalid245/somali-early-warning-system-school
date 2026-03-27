import { AlertCircle } from 'lucide-react';

export default function ImmediateAttentionWidget({ students, getRiskBadgeColor, onCreateCase }) {
  if (!students || students.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Immediate Attention Required</p>
          <p className="text-xs text-gray-400 mt-0.5">Critical risk — no active intervention case</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {students.map((student) => (
          <div key={student.student__student_id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{student.student__full_name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskBadgeColor(student.risk_level)}`}>
                    {student.risk_level?.charAt(0).toUpperCase() + student.risk_level?.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 flex flex-wrap gap-2">
                  {student.classroom && <span>{student.classroom}</span>}
                  <span>{student.attendance_rate}% attendance</span>
                  {!student.has_intervention && <span className="text-red-500 font-medium">No case open</span>}
                  {student.days_since_followup > 7 && <span className="text-orange-500 font-medium">{student.days_since_followup}d overdue</span>}
                </p>
              </div>
              <button
                onClick={() => onCreateCase?.(student)}
                className="shrink-0 px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-medium rounded-lg transition-colors"
              >
                Open Case
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
