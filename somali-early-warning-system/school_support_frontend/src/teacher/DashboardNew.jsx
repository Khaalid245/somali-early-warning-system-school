import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboard();
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-4 sm:p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard</p>
          <button onClick={loadDashboard} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} searchQuery="" onSearchChange={() => {}} />

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  👋 Welcome back, {user?.name}!
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Here's what's happening with your students today</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={() => navigate('/teacher/attendance')}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl sm:text-4xl">📝</span>
                    <h3 className="text-lg sm:text-xl font-bold">Record Attendance</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100">Mark who came to class today</p>
                </button>

                <button
                  onClick={() => navigate('/teacher/attendance-tracking')}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl sm:text-4xl">📊</span>
                    <h3 className="text-lg sm:text-xl font-bold">View Tracking</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-100">See student attendance records</p>
                </button>
              </div>

              {/* Today's Summary Cards */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📅</span> Today's Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Absences */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl sm:text-4xl">😔</span>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{dashboardData.today_absent_count || 0}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Students Absent</p>
                    <p className="text-xs text-gray-500 mt-1">Missing class today</p>
                  </div>

                  {/* Active Alerts */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl sm:text-4xl">🔔</span>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-orange-600">{dashboardData.active_alerts || 0}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Active Alerts</p>
                    <p className="text-xs text-gray-500 mt-1">Students need attention</p>
                  </div>

                  {/* High Risk */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl sm:text-4xl">⚠️</span>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{dashboardData.high_risk_students?.length || 0}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">High Risk Students</p>
                    <p className="text-xs text-gray-500 mt-1">Need urgent help</p>
                  </div>
                </div>
              </div>

              {/* My Classes */}
              {dashboardData.my_classes?.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📚</span> My Classes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardData.my_classes.map((cls) => (
                      <div key={cls.assignment_id} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm hover:border-blue-400 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{cls.classroom__name}</p>
                            <p className="text-sm text-gray-600 truncate">{cls.subject__name}</p>
                          </div>
                          <button
                            onClick={() => navigate('/teacher/attendance', { state: { classroom: cls.classroom__name, subject: cls.subject__name } })}
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            Take Attendance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Alerts */}
              {dashboardData.urgent_alerts?.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span>🔔</span> Recent Alerts
                    </h2>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.urgent_alerts.slice(0, 5).map((alert) => (
                      <div key={alert.alert_id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:border-orange-400 transition">
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
                    ))}
                  </div>
                </div>
              )}

              {/* High Risk Students */}
              {dashboardData.high_risk_students?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span>⚠️</span> Students Need Help
                    </h2>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.high_risk_students.slice(0, 5).map((student, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:border-red-400 transition">
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
                            <p className="text-sm text-gray-600">ID: {student.student__student_id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "alerts" && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">🔔 All Alerts</h1>
              {dashboardData.urgent_alerts?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.urgent_alerts.map((alert) => (
                    <div key={alert.alert_id} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.risk_level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.risk_level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700' :
                          alert.risk_level?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {alert.risk_level?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{alert.alert_type}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-1">{alert.student__full_name}</p>
                      <p className="text-sm text-gray-600">{alert.subject__name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
                  <p className="text-4xl mb-4">✅</p>
                  <p className="text-gray-500">No active alerts</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">⚠️ High Risk Students</h1>
              {dashboardData.high_risk_students?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.high_risk_students.map((student, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          student.risk_level?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                          student.risk_level?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {student.risk_level?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">Risk Score: {student.risk_score}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-1">{student.student__full_name}</p>
                      <p className="text-sm text-gray-600">ID: {student.student__student_id} | Admission: {student.student__admission_number}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
                  <p className="text-4xl mb-4">✅</p>
                  <p className="text-gray-500">No high-risk students</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
