import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import AlertDetailModal from "./AlertDetailModal";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, ChartSkeleton } from "../components/LoadingSkeleton";

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get(`/students/?search=${searchQuery}`),
        api.get(`/students/classrooms/?search=${searchQuery}`)
      ]);
      
      const results = [
        ...studentsRes.data.slice(0, 5).map(s => ({ type: 'student', ...s })),
        ...classesRes.data.slice(0, 3).map(c => ({ type: 'class', ...c }))
      ];
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

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
          <Navbar user={user} dashboardData={{}} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <ChartSkeleton />
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar 
          user={user} 
          dashboardData={dashboardData} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          showSearchResults={showSearchResults}
          onCloseSearch={() => setShowSearchResults(false)}
        />

        <div className="p-8">
          {activeTab === "overview" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    {dashboardData.absent_change_percent !== undefined && (
                      <span className={`text-sm font-semibold ${getTrendColor(dashboardData.absent_trend_direction, true)}`}>
                        {getTrendIcon(dashboardData.absent_trend_direction)} {Math.abs(dashboardData.absent_change_percent)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Today's Absences</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.today_absent_count || 0}</p>
                </div>

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
                  <p className="text-gray-600 text-sm mb-1">Active Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.active_alerts || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">High Risk Students</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.high_risk_students?.length || 0}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {dashboardData.monthly_absence_trend && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Absence Trend (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dashboardData.monthly_absence_trend}>
                        <defs>
                          <linearGradient id="colorAbsence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          fill="url(#colorAbsence)"
                          dot={{ fill: '#ef4444', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {dashboardData.monthly_alert_trend && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Trend (Last 6 Months)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.monthly_alert_trend}>
                        <defs>
                          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorBar)" 
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* My Classes */}
              {dashboardData.my_classes?.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">My Classes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardData.my_classes.map((cls) => (
                      <div key={cls.assignment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                        <div>
                          <p className="font-semibold text-gray-800">{cls.classroom__name}</p>
                          <p className="text-sm text-gray-600">{cls.subject__name}</p>
                        </div>
                        <button
                          onClick={() => navigate('/teacher/attendance', { state: { classroom: cls.classroom__name, subject: cls.subject__name } })}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Take Attendance
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "alerts" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {dashboardData.urgent_alerts?.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dashboardData.urgent_alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              alert.risk_level === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {alert.risk_level.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">{alert.alert_type}</span>
                          </div>
                          <p className="font-semibold text-gray-800">{alert.student__full_name}</p>
                          <p className="text-sm text-gray-600">{alert.subject__name}</p>
                        </div>
                        <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No active alerts</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {dashboardData.high_risk_students?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student Name</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Risk Level</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.high_risk_students.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-800">{student.student__full_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.risk_level === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {student.risk_level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{student.risk_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No high-risk students</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={loadDashboard}
        />
      )}
    </div>
  );
}
