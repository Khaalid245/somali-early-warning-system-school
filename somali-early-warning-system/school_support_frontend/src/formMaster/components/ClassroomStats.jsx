export default function ClassroomStats({ classrooms }) {
  if (!classrooms || classrooms.length === 0) return null;

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          My Classrooms — Attendance Overview
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Period: {fmt(thirtyDaysAgo)} – {fmt(today)} (last 30 days) &nbsp;·&nbsp;
                  <span className="text-green-700">≥90% Good</span> &nbsp;·&nbsp;
          <span className="text-yellow-600">75–89% Warning</span> &nbsp;·&nbsp;
          <span className="text-red-600">&lt;75% Critical</span>
        </p>
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
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    classroom.attendance_rate >= 90 ? 'text-green-600' :
                    classroom.attendance_rate >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {classroom.attendance_rate}%
                  </span>
                  <p className="text-xs text-gray-400">
                    {classroom.attendance_rate >= 90 ? 'Good' : classroom.attendance_rate >= 75 ? 'Needs attention' : 'Critical — action required'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
