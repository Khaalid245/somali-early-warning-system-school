import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../utils/toast";

export default function FormMasterDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateCase, setShowCreateCase] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      setLastUpdated(prev => prev);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/");
      setDashboardData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  const getAlertStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      escalated: 'bg-red-100 text-red-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.active;
  };

  const getCaseStatusBadgeColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      awaiting_parent: 'bg-purple-100 text-purple-700',
      escalated_to_admin: 'bg-red-100 text-red-700',
      closed: 'bg-green-100 text-green-700'
    };
    return colors[status] || colors.open;
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const getTrendColor = (trend, inverse = false) => {
    if (inverse) {
      if (trend === "up") return "text-red-600";
      if (trend === "down") return "text-green-600";
    } else {
      if (trend === "up") return "text-green-600";
      if (trend === "down") return "text-red-600";
    }
    return "text-gray-600";
  };

  const handleAlertAction = async (alertId, newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/alerts/${alertId}/`, { status: newStatus });
      showToast.success(`Alert ${newStatus.replace('_', ' ')}`);
      loadDashboard();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to update alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCase = (student) => {
    setSelectedStudent(student);
    setShowCreateCase(true);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <TableSkeleton />
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
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabClick} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-8">
          {activeTab === "overview" && (
            <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Classroom Risk Control Center</h1>
              <p className="text-gray-600">Monitor and manage student interventions</p>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Last updated: {getTimeAgo(lastUpdated)}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                </div>
                {dashboardData.alert_change_percent !== undefined && (
                  <span className={`text-sm font-semibold ${getTrendColor(dashboardData.alert_trend_direction, true)}`}>
                    {getTrendIcon(dashboardData.alert_trend_direction)} {Math.abs(dashboardData.alert_change_percent)}%
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-1">Assigned Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.assigned_alerts || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                {dashboardData.case_change_percent !== undefined && (
                  <span className={`text-sm font-semibold ${getTrendColor(dashboardData.case_trend_direction, true)}`}>
                    {getTrendIcon(dashboardData.case_trend_direction)} {Math.abs(dashboardData.case_change_percent)}%
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-1">Open Cases</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.open_cases || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">High Risk Students</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.high_risk_count || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Escalated Cases</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.escalated_cases || 0}</p>
            </div>
          </div>

          {/* High-Risk Students Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">High-Risk Students - Detailed Attendance</h3>
                <p className="text-sm text-gray-500">Students requiring immediate intervention</p>
              </div>
            </div>
            {dashboardData.high_risk_students?.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Classroom</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Risk</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Attendance %</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Days Missed</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Late Count</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.high_risk_students.map((student) => (
                    <tr key={student.student__student_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{student.student__full_name}</p>
                          <p className="text-xs text-gray-500">ID: {student.student__student_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.classroom}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                          {student.risk_level?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold ${
                            student.attendance_rate >= 80 ? 'text-green-600' :
                            student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                          <span className="text-xs text-gray-500">{student.total_sessions} sessions</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-red-600">{student.absent_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-orange-600">{student.late_count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleCreateCase(student)}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                        >
                          Create Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-gray-500">No high-risk students</div>
            )}
          </div>

          {/* Classroom Statistics */}
          {dashboardData.classroom_stats?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">My Classrooms - Attendance Overview (Last 30 Days)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {dashboardData.classroom_stats.map((classroom) => (
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
          )}

          {/* Intervention Cases */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Intervention Cases</h3>
            </div>
            {dashboardData.pending_cases?.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Case ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Follow-up Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.pending_cases.map((caseItem) => (
                    <tr key={caseItem.case_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm text-gray-800">#{caseItem.case_id}</td>
                      <td className="px-6 py-4 text-gray-800">{caseItem.student__full_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCaseStatusBadgeColor(caseItem.status)}`}>
                          {caseItem.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {caseItem.follow_up_date ? new Date(caseItem.follow_up_date).toLocaleDateString() : 'Not set'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-gray-500">No pending cases</div>
            )}
          </div>

            </>
          )}

          {activeTab === "alerts" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Assigned Alerts</h3>
              </div>
            {dashboardData.urgent_alerts?.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {dashboardData.urgent_alerts.map((alert) => (
                  <div key={alert.alert_id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(alert.risk_level)}`}>
                            {alert.risk_level?.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAlertStatusBadgeColor(alert.status)}`}>
                            {alert.status?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{alert.alert_type}</span>
                        </div>
                        <p className="font-semibold text-gray-800">{alert.student__full_name}</p>
                        <p className="text-sm text-gray-600">{alert.subject__name}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(alert.alert_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'active' && (
                          <button 
                            onClick={() => handleAlertAction(alert.alert_id, 'under_review')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                          >
                            Review
                          </button>
                        )}
                        {alert.status === 'under_review' && (
                          <>
                            <button 
                              onClick={() => handleAlertAction(alert.alert_id, 'escalated')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                            >
                              Escalate
                            </button>
                            <button 
                              onClick={() => handleAlertAction(alert.alert_id, 'resolved')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                        {alert.status === 'escalated' && (
                          <span className="px-3 py-1.5 text-sm text-gray-500">Escalated to Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No recent alerts</div>
            )}
          </div>
          )}

          {activeTab === "cases" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Intervention Cases</h3>
              </div>
              {dashboardData.pending_cases?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Case ID</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Follow-up Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.pending_cases.map((caseItem) => (
                      <tr key={caseItem.case_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono text-sm text-gray-800">#{caseItem.case_id}</td>
                        <td className="px-6 py-4 text-gray-800">{caseItem.student__full_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCaseStatusBadgeColor(caseItem.status)}`}>
                            {caseItem.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {caseItem.follow_up_date ? new Date(caseItem.follow_up_date).toLocaleDateString() : 'Not set'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(caseItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-500">No pending cases</div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">High-Risk Students</h3>
              </div>
              {dashboardData.high_risk_students?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Classroom</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Risk</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Attendance %</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Days Missed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.high_risk_students.map((student) => (
                      <tr key={student.student__student_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-800 font-medium">{student.student__full_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.classroom}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                            {student.risk_level?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{student.attendance_rate}%</td>
                        <td className="px-6 py-4 text-center font-bold text-red-600">{student.absent_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-500">No high-risk students</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
