import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AlertDetailModal from "./AlertDetailModal";
import DashboardSkeleton from "./DashboardSkeleton";
import DashboardErrorBoundary from "./DashboardErrorBoundary";

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError(null);
        const res = await api.get("/dashboard/");
        setDashboardData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
        setError(err.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    
    // Poll every 5 minutes for real-time updates
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <p className="text-xl text-red-600 mb-4">⚠️ {error || "Failed to load dashboard"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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

        {/* Enhanced Class Information & Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI-Powered Insights */}
          {dashboardData.insights?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">💡</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">AI-Powered Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.insights.map((insight, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-l-4 ${
                    insight.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                    insight.type === 'success' ? 'border-green-500 bg-green-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800 mb-1">{insight.title}</p>
                        <p className="text-sm text-gray-600 mb-2">{insight.message}</p>
                        <p className="text-xs text-gray-500 italic">💡 {insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced My Classes */}
          {dashboardData.my_classes?.length > 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">My Classes</h3>
              </div>
              <div className="space-y-4">
                {dashboardData.my_classes.map((cls) => (
                  <div key={cls.assignment_id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xl font-bold text-gray-800">{cls.subject__name}</p>
                        <p className="text-gray-600">{cls.classroom__name}</p>
                        <p className="text-sm text-gray-500">{cls.student_count || 0} students enrolled</p>
                        {cls.recent_attendance_rate && (
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            📊 {cls.recent_attendance_rate}% attendance (last 7 days)
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => navigate('/teacher/attendance', { state: { classroom: cls.classroom__name, subject: cls.subject__name } })} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        ✓ Take Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty Dashboard Guidance */
            dashboardData.empty_dashboard_guidance && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-yellow-500">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Getting Started</h3>
                </div>
                <p className="text-gray-600 mb-4">{dashboardData.empty_dashboard_guidance.message}</p>
                {dashboardData.empty_dashboard_guidance.contact_admin && (
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                    Contact Administrator
                  </button>
                )}
                {dashboardData.empty_dashboard_guidance.onboarding_steps && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Next Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      {dashboardData.empty_dashboard_guidance.onboarding_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          )}

          {/* Enhanced Action Items with Recommendations */}
          {dashboardData.action_items?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Action Items</h3>
              </div>
              <div className="space-y-3">
                {dashboardData.action_items.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-l-4 ${
                    item.priority === 'Critical' ? 'border-red-500 bg-red-50' :
                    item.priority === 'High' ? 'border-orange-500 bg-orange-50' :
                    item.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.category}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        {item.action && (
                          <p className="text-xs text-gray-700 mt-2">
                            <span className="font-semibold">Action:</span> {item.action}
                          </p>
                        )}
                        {item.recommendation && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            💡 {item.recommendation}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${
                        item.priority === 'Critical' ? 'bg-red-600 text-white' :
                        item.priority === 'High' ? 'bg-orange-600 text-white' :
                        item.priority === 'Medium' ? 'bg-yellow-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Urgent Alerts with Visual Indicators */}
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
                        {alert.visual_indicators && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500">
                              Status: <span className="font-semibold">{alert.visual_indicators.status_badge}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                              Days since created: {alert.visual_indicators.days_since_created}
                            </p>
                            <p className="text-sm text-gray-500">
                              Urgency score: <span className="font-semibold text-red-600">{alert.visual_indicators.urgency_score}/100</span>
                            </p>
                          </div>
                        )}
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

        {/* Weekly Attendance Summary */}
        {dashboardData.weekly_attendance_summary && (
          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Weekly Attendance Summary</h3>
              {dashboardData.time_range_info && (
                <div className="ml-auto text-sm text-gray-500">
                  {dashboardData.time_range_info.current_range} ({dashboardData.time_range_info.start_date} to {dashboardData.time_range_info.end_date})
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(dashboardData.weekly_attendance_summary).map(([day, data]) => (
                <div key={day} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 capitalize">{day.slice(0, 3)}</p>
                  <p className="text-lg font-bold text-gray-800">{data.present}/{data.total}</p>
                  <p className="text-xs text-gray-500">{data.rate}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Semester Comparison & Student Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Semester Comparison */}
          {dashboardData.semester_comparison && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Semester Comparison</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Current Semester</p>
                  <p className="text-xs text-gray-500 mb-2">{dashboardData.semester_comparison.current_semester.period}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{dashboardData.semester_comparison.current_semester.attendance_rate}%</p>
                      <p className="text-xs text-gray-500">Attendance Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-700">{dashboardData.semester_comparison.current_semester.total_sessions}</p>
                      <p className="text-xs text-gray-500">Total Sessions</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Previous Semester</p>
                  <p className="text-xs text-gray-500 mb-2">{dashboardData.semester_comparison.previous_semester.period}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-bold text-gray-600">{dashboardData.semester_comparison.previous_semester.attendance_rate}%</p>
                      <p className="text-xs text-gray-500">Attendance Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-700">{dashboardData.semester_comparison.previous_semester.total_sessions}</p>
                      <p className="text-xs text-gray-500">Total Sessions</p>
                    </div>
                  </div>
                </div>
                <div className={`p-3 rounded-lg text-center ${
                  dashboardData.semester_comparison.comparison.trend === 'improving' ? 'bg-green-100' :
                  dashboardData.semester_comparison.comparison.trend === 'declining' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <p className={`text-lg font-bold ${
                    dashboardData.semester_comparison.comparison.trend === 'improving' ? 'text-green-700' :
                    dashboardData.semester_comparison.comparison.trend === 'declining' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {dashboardData.semester_comparison.comparison.rate_change > 0 ? '+' : ''}{dashboardData.semester_comparison.comparison.rate_change}% {dashboardData.semester_comparison.comparison.trend.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student Progress Tracking */}
          {dashboardData.student_progress_tracking?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-teal-100 p-3 rounded-full mr-4">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Student Progress (30 Days)</h3>
              </div>
              <div className="space-y-3">
                {dashboardData.student_progress_tracking.map((student, idx) => (
                  <div key={idx} className="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{student.student_name}</p>
                        <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{student.previous_rate}%</span>
                          <span className={`text-xl ${
                            student.trend === 'improving' ? 'text-green-600' :
                            student.trend === 'declining' ? 'text-red-600' :
                            'text-gray-500'
                          }`}>
                            {student.trend === 'improving' ? '↗' : student.trend === 'declining' ? '↘' : '→'}
                          </span>
                          <span className={`text-lg font-bold ${
                            student.trend === 'improving' ? 'text-green-600' :
                            student.trend === 'declining' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {student.recent_rate}%
                          </span>
                        </div>
                        <p className={`text-xs font-semibold ${
                          student.change > 0 ? 'text-green-600' : student.change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {student.change > 0 ? '+' : ''}{student.change}%
                        </p>
                      </div>
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
