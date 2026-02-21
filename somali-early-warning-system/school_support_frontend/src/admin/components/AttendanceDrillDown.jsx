import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function AttendanceDrillDown() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highRiskCount, setHighRiskCount] = useState(0);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await api.get('/dashboard/admin/attendance/drill-down/');
      setClassrooms(response.data.classrooms);
      setHighRiskCount(response.data.high_risk_count);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
      showToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAbsenceColor = (rate) => {
    if (rate > 30) return 'text-red-600 bg-red-50';
    if (rate > 20) return 'text-orange-600 bg-orange-50';
    if (rate > 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Attendance Compliance Detail</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-semibold text-red-600">
            {highRiskCount} High-Risk Classroom{highRiskCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Form Master</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Students</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Absence Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Absences (30d)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {classrooms.map((classroom) => (
              <tr key={classroom.classroom_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{classroom.classroom_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{classroom.form_master}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{classroom.total_students}</span>
                </td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getAbsenceColor(classroom.absence_rate)}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{classroom.absence_rate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{classroom.total_absences}</span>
                </td>
                <td className="px-4 py-3">
                  {classroom.is_high_risk ? (
                    <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-300">
                      HIGH RISK
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-300">
                      NORMAL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No attendance data available</p>
        </div>
      )}
    </div>
  );
}
