import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AlertDetailModal from "./AlertDetailModal";

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/dashboard/");
        setDashboardData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <p className="text-xl text-red-600">⚠️ Failed to load dashboard</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getTrendColor = (trend) => {
    if (trend === "up") return "text-red-600";
    if (trend === "down") return "text-green-600";
    return "text-gray-500";
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const getTrendBg = (trend) => {
    if (trend === "up") return "bg-red-50";
    if (trend === "down") return "bg-green-50";
    return "bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👋 Welcome, {user?.name || "Teacher"}</h1>
            <p className="text-gray-600 mt-1">Here's your classroom overview for today</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 text-lg rounded-xl hover:bg-red-100 shadow-lg transition font-semibold">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Absences */}
          <div className={`bg-white p-8 rounded-2xl shadow-xl border-l-8 border-red-500 ${getTrendBg(dashboardData.absent_trend_direction)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <span className="text-4xl">📅</span>
              </div>
              {dashboardData.absent_change_percent !== undefined && (
                <div className={`text-3xl font-bold ${getTrendColor(dashboardData.absent_trend_direction)}`}>
                  {getTrendIcon(dashboardData.absent_trend_direction)}
                </div>
              )}
            </div>
            <p className="text-gray-600 text-lg mb-2">Today's Absences</p>
            <h2 className="text-5xl font-bold text-gray-800">{dashboardData.today_absent_count || 0}</h2>
            {dashboardData.absent_change_percent !== undefined && (
              <p className={`text-sm mt-3 font-semibold ${getTrendColor(dashboardData.absent_trend_direction)}`}>
                {Math.abs(dashboardData.absent_change_percent)}% vs last month
              </p>
            )}
          </div>

          {/* Active Alerts */}
          <div className={`bg-white p-8 rounded-2xl shadow-xl border-l-8 border-orange-500 ${getTrendBg(dashboardData.alert_trend_direction)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <span className="text-4xl">🔔</span>
              </div>
              {dashboardData.alert_change_percent !== undefined && (
                <div className={`text-3xl font-bold ${getTrendColor(dashboardData.alert_trend_direction)}`}>
                  {getTrendIcon(dashboardData.alert_trend_direction)}
                </div>
              )}
            </div>
            <p className="text-gray-600 text-lg mb-2">Active Alerts</p>
            <h2 className="text-5xl font-bold text-gray-800">{dashboardData.active_alerts || 0}</h2>
            {dashboardData.alert_change_percent !== undefined && (
              <p className={`text-sm mt-3 font-semibold ${getTrendColor(dashboardData.alert_trend_direction)}`}>
                {Math.abs(dashboardData.alert_change_percent)}% vs last month
              </p>
            )}
          </div>

          {/* High Risk Students */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-l-8 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>
            <p className="text-gray-600 text-lg mb-2">High Risk Students</p>
            <h2 className="text-5xl font-bold text-gray-800">{dashboardData.high_risk_students?.length || 0}</h2>
            <p className="text-sm mt-3 text-gray-500">Require immediate attention</p>
          </div>
        </div>

        {/* Quick Actions & Urgent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* My Classes - Quick Actions */}
          {dashboardData.my_classes?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">My Classes</h3>
              </div>
              <div className="space-y-4">
                {dashboardData.my_classes.map((cls) => (
                  <div key={cls.assignment_id} className="flex justify-between items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition">
                    <div>
                      <p className="text-xl font-bold text-gray-800">{cls.classroom__name}</p>
                      <p className="text-gray-600">{cls.subject__name}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/teacher/attendance', { state: { classroom: cls.classroom__name, subject: cls.subject__name } })} 
                      className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 shadow-lg transition font-semibold"
                    >
                      ✓ Take Attendance
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Urgent Alerts */}
          {dashboardData.urgent_alerts?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">🚨</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Urgent Alerts</h3>
              </div>
              <div className="space-y-3">
                {dashboardData.urgent_alerts.map((alert) => (
                  <div 
                    key={alert.alert_id} 
                    className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r-xl cursor-pointer hover:bg-red-100 transition" 
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-gray-800">{alert.student__full_name}</p>
                        <p className="text-gray-600">{alert.subject__name} • {alert.alert_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        alert.risk_level === "critical" ? "bg-red-600 text-white" : "bg-orange-500 text-white"
                      }`}>
                        {alert.risk_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {dashboardData.monthly_absence_trend && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">📉 Monthly Absence Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthly_absence_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={{ fontSize: '14px' }} />
                  <YAxis style={{ fontSize: '14px' }} />
                  <Tooltip contentStyle={{ fontSize: '14px' }} />
                  <Legend wrapperStyle={{ fontSize: '14px' }} />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} name="Absences" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {dashboardData.monthly_alert_trend && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Monthly Alert Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthly_alert_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={{ fontSize: '14px' }} />
                  <YAxis style={{ fontSize: '14px' }} />
                  <Tooltip contentStyle={{ fontSize: '14px' }} />
                  <Legend wrapperStyle={{ fontSize: '14px' }} />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} name="Alerts" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* High Risk Students Table */}
        {dashboardData.high_risk_students?.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">High Risk Students</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-4 px-4 text-lg font-bold text-gray-700">Student Name</th>
                    <th className="text-left py-4 px-4 text-lg font-bold text-gray-700">Risk Level</th>
                    <th className="text-left py-4 px-4 text-lg font-bold text-gray-700">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.high_risk_students.map((student, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="py-4 px-4 text-lg text-gray-800">{student.student__full_name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          student.risk_level === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {student.risk_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-lg font-bold text-gray-800">{student.risk_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={() => {
            const res = api.get("/dashboard/");
            res.then(data => setDashboardData(data.data));
          }}
        />
      )}
    </div>
  );
}
