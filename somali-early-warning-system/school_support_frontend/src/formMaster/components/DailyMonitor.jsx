import { useEffect, useState } from 'react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import { RefreshCw, AlertCircle, Clock, CheckCircle, Phone, Mail } from 'lucide-react';

export default function DailyMonitor() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDailyData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDailyData();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDailyData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dashboardRes = await api.get('/dashboard/');
      
      const dashboardData = dashboardRes.data;
      const allStudents = dashboardData.high_risk_students || [];

      // Calculate today's stats from dashboard data
      const absentStudents = allStudents.filter(s => s.absent_count > 0).slice(0, 10);
      const totalStudents = allStudents.length;
      const avgAttendance = totalStudents > 0 
        ? (allStudents.reduce((sum, s) => sum + s.attendance_rate, 0) / totalStudents).toFixed(1)
        : 0;

      setDailyData({
        totalRecords: totalStudents,
        presentCount: Math.round(totalStudents * (avgAttendance / 100)),
        absentCount: absentStudents.length,
        lateCount: allStudents.filter(s => s.late_count > 0).length,
        attendanceRate: avgAttendance,
        absentStudents: absentStudents.map(s => ({
          student_id: s.student__student_id,
          student_name: s.student__full_name,
          classroom: s.classroom,
          days_missed: s.absent_count
        })),
        lateStudents: allStudents.filter(s => s.late_count > 0).slice(0, 10).map(s => ({
          student_id: s.student__student_id,
          student_name: s.student__full_name,
          classroom: s.classroom,
          late_count: s.late_count
        })),
        todayAlerts: dashboardData.urgent_alerts?.slice(0, 5) || []
      });
      setLastUpdated(new Date());
    } catch (err) {
      showToast.error('Failed to load daily data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Auto-Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Daily Monitor</h2>
          <p className="text-xs sm:text-sm text-gray-600 truncate">Real-time attendance tracking for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={loadDailyData}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="whitespace-nowrap">{getTimeAgo(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Today's Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Present</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dailyData?.presentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Absent</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dailyData?.absentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Late</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dailyData?.lateCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0">📊</span>
            <div className="min-w-0">
              <p className="text-xs text-gray-600">Attendance Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dailyData?.attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Absent Today */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Students Absent Today</h3>
          <p className="text-xs text-gray-500">Requires immediate follow-up</p>
        </div>
        {dailyData?.absentStudents.length > 0 ? (
          <>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Classroom</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Days Missed</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dailyData.absentStudents.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.classroom}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-red-600">{student.days_missed} days</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Call Parent">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Send Email">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden">
            {dailyData.absentStudents.map((student, idx) => (
              <div key={idx} className="p-3 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800 truncate">{student.student_name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{student.classroom}</p>
                  </div>
                  <span className="text-base font-bold text-red-600 flex-shrink-0">{student.days_missed} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 p-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" />
                    Call
                  </button>
                  <button className="flex-1 p-2 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded transition flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p>Perfect attendance today! 🎉</p>
          </div>
        )}
      </div>

      {/* Students Late Today */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Students Late Today</h3>
          <p className="text-xs text-gray-500">Monitor for patterns</p>
        </div>
        {dailyData?.lateStudents.length > 0 ? (
          <>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Classroom</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Late Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dailyData.lateStudents.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.classroom}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-orange-600">{student.late_count} times</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden">
            {dailyData.lateStudents.map((student, idx) => (
              <div key={idx} className="p-3 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800 truncate">{student.student_name}</p>
                    <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{student.classroom}</p>
                  </div>
                  <span className="text-base font-bold text-orange-600 flex-shrink-0">{student.late_count} times</span>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">No late arrivals today</div>
        )}
      </div>

      {/* Today's New Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">New Alerts Today</h3>
        </div>
        {dailyData?.todayAlerts.length > 0 ? (
          <div>
            {dailyData.todayAlerts.map((alert) => (
              <div key={alert.alert_id} className="p-3 sm:p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{alert.student__full_name || 'Unknown Student'}</p>
                    <p className="text-xs text-gray-600">{alert.alert_type?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    alert.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                    alert.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {alert.risk_level?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">No new alerts today</div>
        )}
      </div>
    </div>
  );
}
