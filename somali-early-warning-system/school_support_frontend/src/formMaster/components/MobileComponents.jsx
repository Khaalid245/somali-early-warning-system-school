// Mobile-optimized student card component
export function StudentCard({ student, onCreateCase, onViewDetails }) {
  const getRiskColor = (level) => {
    const colors = {
      critical: 'bg-red-100 border-red-300 text-red-800',
      high: 'bg-orange-100 border-orange-300 text-orange-800',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      low: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getRiskColor(student.risk_level)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{student.student__full_name}</h3>
          <p className="text-sm opacity-75">ID: {student.student__student_id}</p>
          <p className="text-sm opacity-75">{student.classroom}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-bold bg-white bg-opacity-50">
          {student.risk_level?.toUpperCase()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white bg-opacity-50 rounded p-2">
          <p className="text-xs opacity-75">Attendance</p>
          <p className="text-xl font-bold">{student.attendance_rate}%</p>
        </div>
        <div className="bg-white bg-opacity-50 rounded p-2">
          <p className="text-xs opacity-75">Days Missed</p>
          <p className="text-xl font-bold">{student.absent_count}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(student)}
          className="flex-1 py-2 bg-white rounded font-medium text-sm"
        >
          View
        </button>
        <button
          onClick={() => onCreateCase(student)}
          className="flex-1 py-2 bg-blue-600 text-white rounded font-medium text-sm"
        >
          Create Case
        </button>
      </div>
    </div>
  );
}

// Mobile-optimized alert card
export function AlertCard({ alert, onAction, selected, onToggle }) {
  const getRiskColor = (level) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-gray-500 bg-gray-50'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 bg-white shadow-sm ${getRiskColor(alert.risk_level)}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(alert.alert_id)}
          className="mt-1 w-5 h-5 rounded"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold">{alert.student__full_name}</h4>
              <p className="text-sm text-gray-600">ID: {alert.student__student_id}</p>
            </div>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-white">
              {alert.risk_level?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{alert.subject__name || 'General'}</p>
          <div className="flex gap-2">
            {alert.status === 'active' && (
              <button
                onClick={() => onAction(alert.alert_id, 'under_review')}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm font-medium"
              >
                Review
              </button>
            )}
            {alert.status === 'under_review' && (
              <button
                onClick={() => onAction(alert.alert_id, 'resolved')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized case card
export function CaseCard({ caseItem, onViewDetails }) {
  return (
    <div className={`rounded-lg p-4 border-2 ${caseItem.is_overdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold">#{caseItem.case_id}</h4>
          <p className="text-sm text-gray-600">{caseItem.student__full_name}</p>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            {caseItem.status}
          </span>
          {caseItem.is_overdue && (
            <span className="block mt-1 px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
              OVERDUE
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-600">Days Open</span>
        <span className={`text-lg font-bold ${caseItem.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>
          {caseItem.days_open} days
        </span>
      </div>
      <button
        onClick={() => onViewDetails(caseItem.case_id)}
        className="w-full py-2 bg-blue-600 text-white rounded font-medium"
      >
        View Details
      </button>
    </div>
  );
}

// Mobile KPI card
export function MobileKPICard({ icon, label, value, trend, trendValue }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend === 'down' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(trendValue)}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
