export default function ClassroomStats({ classrooms }) {
  if (!classrooms || classrooms.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">My Classrooms - Attendance Overview (Last 30 Days)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {classrooms.map((classroom) => (
          <div key={classroom.classroom_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{classroom.classroom_name}</h4>
              <span className="text-sm text-gray-500">{classroom.total_students} students</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Attendance Rate</span>
                <span className={`text-lg font-bold ${
                  classroom.attendance_rate >= 80 ? 'text-green-600' :
                  classroom.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {classroom.attendance_rate}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="text-lg font-bold text-green-600">{classroom.present_count}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Absent</p>
                  <p className="text-lg font-bold text-red-600">{classroom.absent_count}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Late</p>
                  <p className="text-lg font-bold text-orange-600">{classroom.late_count}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
