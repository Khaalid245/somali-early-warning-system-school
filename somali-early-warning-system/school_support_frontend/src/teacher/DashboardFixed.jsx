import { useEffect, useState, useContext, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../utils/toast";
import { getUserFriendlyError, operationErrors } from "../utils/errorMessages";
import EmptyState from "../components/EmptyState";
import TablePagination from "../components/TablePagination";
import OfflineIndicator from "../components/OfflineIndicator";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.jsx";
import { RefreshCw } from "lucide-react";
import { validateDashboardData } from "../utils/dashboardSchema";
import { VirtualAlertList, VirtualStudentList } from "../components/VirtualList";
import QuickMessage from "../components/QuickMessage";

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Persistent filters
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('teacher_search') || "");
  const [filterRisk, setFilterRisk] = useState(() => localStorage.getItem('teacher_filter_risk') || "");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Escalation modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalating, setEscalating] = useState(false);
  
  // Messaging
  const [showMessage, setShowMessage] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  
  // FIX 1: Backend pagination state
  const [backendPage, setBackendPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // FIX 2: Debouncing ref
  const debounceTimer = useRef(null);

  // FIX 2: Debounced load function (moved before hooks that use it)
  const loadDashboard = useCallback(async (page = 1) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Debounce: wait 300ms before executing
    debounceTimer.current = setTimeout(async () => {
      try {
        // FIX 1: Use backend pagination
        const res = await api.get(`/dashboard/?page=${page}&page_size=20`);
        
        // FIX 3: Validate response with Zod
        const validation = validateDashboardData(res.data);
        if (!validation.success) {
          console.error('Invalid dashboard data:', validation.error);
          showToast.error('Received invalid data from server');
          return;
        }
        
        setDashboardData(validation.data);
        setBackendPage(page);
        
        // Extract pagination metadata if available
        if (validation.data.pagination) {
          const totalItems = validation.data.pagination.total_students || 0;
          setTotalPages(Math.ceil(totalItems / 20));
        }
        
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to load dashboard", err);
        showToast.error(getUserFriendlyError(err) || operationErrors.loadDashboard);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // CSV Export function
  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showToast.error('No data to export');
      return;
    }
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success(`Exported ${data.length} records to CSV`);
  };

  const getFormMasterId = async () => {
    try {
      const res = await api.get('/users/?role=form_master&page_size=1');
      const formMasters = res.data.results || [];
      return formMasters.length > 0 ? formMasters[0].id : null;
    } catch (err) {
      console.error('Failed to get form master', err);
      return null;
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      showToast.error('Please provide a reason for escalation');
      return;
    }
    setEscalating(true);
    try {
      await api.post('/cases/', {
        student: selectedStudent.student__student_id,
        case_type: 'attendance',
        description: escalationReason,
        priority: selectedStudent.risk_level === 'critical' ? 'high' : 'medium'
      });
      showToast.success(`Student ${selectedStudent.student__full_name} escalated to Form Master`);
      setShowEscalateModal(false);
      setEscalationReason('');
      setSelectedStudent(null);
      loadDashboard(backendPage);
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || 'Failed to escalate student');
    } finally {
      setEscalating(false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+r': { action: () => loadDashboard(backendPage) },
    'ctrl+a': { action: () => navigate('/teacher/attendance') },
    '/': { action: () => document.querySelector('input[type="text"]')?.focus() }
  });

  useEffect(() => {
    loadDashboard(1);
    const interval = setInterval(() => loadDashboard(backendPage), 300000); // Auto-refresh every 5 min
    return () => {
      clearInterval(interval);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadDashboard, backendPage]);

  useEffect(() => {
    localStorage.setItem('teacher_search', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('teacher_filter_risk', filterRisk);
  }, [filterRisk]);

  // Auto-switch to alerts/students tab when searching
  useEffect(() => {
    if (searchTerm && activeTab === 'overview') {
      // Switch to alerts tab if there are alerts, otherwise students
      if (dashboardData?.urgent_alerts?.length > 0) {
        setActiveTab('alerts');
      } else if (dashboardData?.high_risk_students?.length > 0) {
        setActiveTab('students');
      }
    }
  }, [searchTerm, activeTab, dashboardData]);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Filter and pagination logic
  const filteredAlerts = useMemo(() => {
    if (!dashboardData?.urgent_alerts) return [];
    let filtered = [...dashboardData.urgent_alerts];
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.student__full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRisk) {
      filtered = filtered.filter(a => a.risk_level === filterRisk);
    }
    return filtered;
  }, [dashboardData?.urgent_alerts, searchTerm, filterRisk]);

  const filteredStudents = useMemo(() => {
    if (!dashboardData?.high_risk_students) return [];
    let filtered = [...dashboardData.high_risk_students];
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.student__full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student__student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRisk) {
      filtered = filtered.filter(s => s.risk_level === filterRisk);
    }
    return filtered;
  }, [dashboardData?.high_risk_students, searchTerm, filterRisk]);

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(start, start + itemsPerPage);
  }, [filteredAlerts, currentPage]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPagesAlerts = Math.ceil(filteredAlerts.length / itemsPerPage);
  const totalPagesStudents = Math.ceil(filteredStudents.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-4 sm:p-8">
            <PageSkeleton />
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
          <button onClick={() => loadDashboard(1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OfflineIndicator />
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar 
          user={user} 
          dashboardData={dashboardData} 
          searchQuery={searchTerm} 
          onSearchChange={setSearchTerm}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {user?.name}!
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Here's what's happening with your students today</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadDashboard(backendPage)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>{getTimeAgo(lastUpdated)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={() => navigate('/teacher/attendance')}
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl sm:text-4xl">✓</span>
                    <h3 className="text-lg sm:text-xl font-bold">Record Attendance</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100">Mark student attendance for today</p>
                </button>

                <button
                  onClick={() => navigate('/teacher/messages')}
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl sm:text-4xl">💬</span>
                    <h3 className="text-lg sm:text-xl font-bold">Message Form Master</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-green-100">Send a message about student concerns</p>
                </button>
              </div>

              {/* Today's Summary Cards */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Today's Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl sm:text-4xl">⚠</span>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{dashboardData.today_absent_count || 0}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Students Absent</p>
                    <p className="text-xs text-gray-500 mt-1">Missing class today</p>
                  </div>

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

                  <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl sm:text-4xl">!</span>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{dashboardData.high_risk_students?.length || 0}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">High Risk Students</p>
                    <p className="text-xs text-gray-500 mt-1">Need urgent help</p>
                  </div>
                </div>
              </div>

              {/* Refresh Button already exists */}

              {/* Recent Attendance Sessions Widget */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Recent Attendance Sessions
                </h2>
                {dashboardData.recent_sessions?.length > 0 ? (
                  <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Class</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Subject</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Present</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Absent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dashboardData.recent_sessions.slice(0, 5).map((session, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{new Date(session.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm">{session.classroom}</td>
                              <td className="px-4 py-3 text-sm">{session.subject}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{session.present}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">{session.absent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="📋"
                    title="No Recent Sessions"
                    message="You haven't recorded any attendance yet. Start by clicking 'Record Attendance' above."
                  />
                )}
              </div>

              {/* Statistics Charts */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Attendance Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week Overview</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Present</span>
                          <span className="font-semibold text-green-600">{dashboardData.week_stats?.present || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: `${dashboardData.week_stats?.present || 0}%`}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Late</span>
                          <span className="font-semibold text-yellow-600">{dashboardData.week_stats?.late || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${dashboardData.week_stats?.late || 0}%`}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Absent</span>
                          <span className="font-semibold text-red-600">{dashboardData.week_stats?.absent || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: `${dashboardData.week_stats?.absent || 0}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Trend Comparison</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">vs Last Week</span>
                        <span className={`text-sm font-bold ${dashboardData.trend?.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {dashboardData.trend?.direction === 'up' ? '↑' : '↓'} {dashboardData.trend?.percent || 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Classes</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.my_classes?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Attendance</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardData.avg_attendance || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  My Classes
                </h2>
                {dashboardData.my_classes?.length > 0 ? (
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
                ) : (
                  <EmptyState
                    icon="📚"
                    title="No Classes Assigned"
                    message="You don't have any classes assigned yet. Please contact your administrator to get class assignments."
                  />
                )}
              </div>

              {/* Recent Alerts */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    Recent Alerts
                  </h2>
                  {dashboardData.urgent_alerts?.length > 0 && (
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </button>
                  )}
                </div>
                {dashboardData.urgent_alerts?.length > 0 ? (
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
                ) : (
                  <EmptyState
                    icon="✓"
                    title="No Active Alerts"
                    message="Great! There are no active alerts at this time. All students are being monitored effectively."
                  />
                )}
              </div>

              {/* High Risk Students */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    Students Need Help
                  </h2>
                  {dashboardData.high_risk_students?.length > 0 && (
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </button>
                  )}
                </div>
                {dashboardData.high_risk_students?.length > 0 ? (
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
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowEscalateModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium whitespace-nowrap"
                          >
                            Escalate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="✓"
                    title="No High-Risk Students"
                    message="Excellent! All students are performing well. Keep up the great work!"
                  />
                )}
              </div>
            </>
          )}

          {activeTab === "alerts" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Alerts</h1>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterRisk}
                    onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {(searchTerm || filterRisk) && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilterRisk(''); setCurrentPage(1); }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => handleExportCSV(filteredAlerts.map(a => ({
                      Student: a.student__full_name,
                      Risk: a.risk_level,
                      Type: a.alert_type,
                      Subject: a.subject__name
                    })), 'alerts')}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {paginatedAlerts.length > 0 ? (
                <>
                  {/* FIX 3: Use virtual scrolling for 100+ items */}
                  {filteredAlerts.length > 100 ? (
                    <VirtualAlertList alerts={filteredAlerts} />
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedAlerts.map((alert) => (
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
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPagesAlerts}
                        totalItems={filteredAlerts.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
                </>
              ) : (
                <EmptyState
                  icon="🔔"
                  title={searchTerm || filterRisk ? "No Alerts Found" : "No Active Alerts"}
                  message={searchTerm || filterRisk 
                    ? "No alerts match your search criteria. Try adjusting your filters."
                    : "Great! There are no active alerts at this time."}
                  actionLabel={searchTerm || filterRisk ? "Clear Filters" : null}
                  onAction={() => { setSearchTerm(''); setFilterRisk(''); }}
                />
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">High Risk Students</h1>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterRisk}
                    onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {(searchTerm || filterRisk) && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilterRisk(''); setCurrentPage(1); }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => handleExportCSV(filteredStudents.map(s => ({
                      Name: s.student__full_name,
                      ID: s.student__student_id,
                      Risk: s.risk_level,
                      Score: s.risk_score,
                      Admission: s.student__admission_number
                    })), 'high_risk_students')}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {paginatedStudents.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {paginatedStudents.map((student, idx) => (
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
                        <p className="text-sm text-gray-600 mb-3">ID: {student.student__student_id} | Admission: {student.student__admission_number}</p>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowEscalateModal(true);
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Escalate to Form Master
                        </button>
                      </div>
                    ))}
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPagesStudents}
                    totalItems={filteredStudents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <EmptyState
                  icon="⚠️"
                  title={searchTerm || filterRisk ? "No Students Found" : "No High-Risk Students"}
                  message={searchTerm || filterRisk 
                    ? "No students match your search criteria. Try adjusting your filters."
                    : "Excellent! All students are performing well."}
                  actionLabel={searchTerm || filterRisk ? "Clear Filters" : null}
                  onAction={() => { setSearchTerm(''); setFilterRisk(''); }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalateModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Escalate to Form Master</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Student: <span className="font-semibold text-gray-900">{selectedStudent.student__full_name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Risk Level: <span className={`font-semibold ${
                selectedStudent.risk_level === 'critical' ? 'text-red-600' : 'text-orange-600'
              }`}>{selectedStudent.risk_level?.toUpperCase()}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Escalation *</label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Describe the concerns and why this student needs intervention..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows="4"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalationReason('');
                  setSelectedStudent(null);
                }}
                disabled={escalating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={escalating || !escalationReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {escalating ? 'Escalating...' : 'Escalate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessage && messageRecipient && (
        <QuickMessage
          recipientId={messageRecipient.id}
          recipientName={messageRecipient.name}
          recipientRole={messageRecipient.role}
          onClose={() => setShowMessage(false)}
        />
      )}
    </div>
  );
}
