import { List } from 'react-window';

// FIX 3: Virtual scrolling for large lists (100+ items)
export function VirtualAlertList({ alerts, onAlertClick }) {
  const Row = ({ rowIndex: index }) => {
    const alert = alerts[index];
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:border-orange-400 transition mb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  alert.risk_level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.risk_level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700' :
                  alert.risk_level?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {alert.risk_level?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{alert.alert_type}</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1 truncate">{alert.student__full_name}</p>
              <p className="text-sm text-gray-600 truncate">{alert.subject__name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <List
      rowCount={alerts.length}
      rowHeight={120}
      defaultHeight={600}
      defaultWidth="100%"
      rowComponent={Row}
    />
  );
}

export function VirtualStudentList({ students }) {
  const Row = ({ rowIndex: index }) => {
    const student = students[index];
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:border-red-400 transition mb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  student.risk_level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                  student.risk_level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {student.risk_level?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">Risk Score: {student.risk_score}</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1 truncate">{student.student__full_name}</p>
              <p className="text-sm text-gray-600">ID: {student.student__student_id} | Admission: {student.student__admission_number}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <List
      rowCount={students.length}
      rowHeight={120}
      defaultHeight={600}
      defaultWidth="100%"
      rowComponent={Row}
    />
  );
}
