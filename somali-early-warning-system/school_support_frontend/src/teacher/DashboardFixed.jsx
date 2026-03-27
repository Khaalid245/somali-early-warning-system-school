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
import { RefreshCw, CheckCircle, MessageSquare, AlertTriangle, Bell, Users, BookOpen, ClipboardList, CheckSquare, TrendingUp } from "lucide-react";
import { validateDashboardData } from "../utils/dashboardSchema";
import { VirtualAlertList } from "../components/VirtualList";

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
  
  // Issue 13 fix: removed unused showMessage/messageRecipient state — QuickMessage modal
  // was wired up but had no trigger button. Messages go via /teacher/messages route instead.
  
  // Issue 9 fix: single stable load function, no debounce timer, no backendPage dependency
  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/');
      const validation = validateDashboardData(res.data);
      if (!validation.success) {
        showToast.error('Received invalid data from server');
        return;
      }
      setDashboardData(validation.data);
      setLastUpdated(new Date());
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || operationErrors.loadDashboard);
    } finally {
      setLoading(false);
    }
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

  // Issue 10 fix: removed unused getFormMasterId dead code

  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      showToast.error('Please provide a reason for escalation');
      return;
    }
    setEscalating(true);
    try {
      // Teachers cannot create intervention cases (backend 403).
      // Correct flow: send a message to the form master flagging the student.
      const fmRes = await api.get('/messages/form-masters/');
      const formMasters = fmRes.data;
      if (!formMasters || formMasters.length === 0) {
        showToast.error('No form master found. Please contact your administrator.');
        return;
      }
      const formMaster = formMasters[0];
      await api.post('/messages/', {
        recipient: formMaster.id,
        subject: `Escalation: ${selectedStudent.student__full_name} (${selectedStudent.risk_level?.toUpperCase()})`,
        message: `Student: ${selectedStudent.student__full_name} (ID: ${selectedStudent.student__student_id})\nRisk Level: ${selectedStudent.risk_level?.toUpperCase()}\nRisk Score: ${selectedStudent.risk_score}\n\nReason for escalation:\n${escalationReason}`,
      });
      showToast.success(`Message sent to form master about ${selectedStudent.student__full_name}`);
      setShowEscalateModal(false);
      setEscalationReason('');
      setSelectedStudent(null);
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || 'Failed to send escalation message');
    } finally {
      setEscalating(false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+r': { action: () => loadDashboard() },
    'ctrl+a': { action: () => navigate('/teacher/attendance') },
    '/': { action: () => document.querySelector('input[type="text"]')?.focus() }
  });

  // Issue 9 fix: single effect, stable interval, no backendPage dependency causing re-registration
  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 300000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

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
          <button onClick={() => loadDashboard(1)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
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
                      onClick={() => loadDashboard()}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                    <div className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
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
                  className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 hover:border-green-400 hover:bg-green-100 transition text-left"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Record Attendance</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Mark student attendance for today</p>
                </button>

                <button
                  onClick={() => navigate('/teacher/messages')}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 hover:border-green-400 hover:bg-green-100 transition text-left"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Message Form Master</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Send a message about student concerns</p>
                </button>
              </div>

              {/* Today's Summary Cards */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Today's Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-800">{dashboardData.today_absent_count || 0}</p>
                        {/* Issue 5 fix: honest label — backend counts absence records, not unique students */}
                        <p className="text-sm text-gray-600">Absence Records Today</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Across all your subjects</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-800">{dashboardData.active_alerts || 0}</p>
                        <p className="text-sm text-gray-600">Active Alerts</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Students need attention</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-800">{dashboardData.high_risk_students?.length || 0}</p>
                        <p className="text-sm text-gray-600">High Risk Students</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Need urgent help</p>
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
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead style={{ backgroundColor: '#F9FAFB' }}>
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
                            <tr key={`session-${session.date}-${session.classroom}-${idx}`} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td className="px-4 py-4 text-sm text-gray-800">{new Date(session.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm text-gray-800">{session.classroom}</td>
                              <td className="px-4 py-4 text-sm text-gray-800">{session.subject}</td>
                              <td className="px-4 py-4 text-center text-sm font-semibold text-green-600">{session.present}</td>
                              <td className="px-4 py-4 text-center text-sm font-semibold text-red-600">{session.absent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<ClipboardList className="w-16 h-16 text-gray-400" />}
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
                    {/* Issue 11 fix: show honest empty state when no sessions recorded this week */}
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week Overview</h3>
                    {(dashboardData.week_stats?.present || 0) === 0 &&
                     (dashboardData.week_stats?.late   || 0) === 0 &&
                     (dashboardData.week_stats?.absent || 0) === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No attendance recorded this week</p>
                    ) : (
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
                    )}
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
                        {/* Issue 4 fix: show dash instead of 0% when no data exists */}
                        <span className="text-sm font-bold text-gray-900">
                          {dashboardData.avg_attendance > 0 ? `${dashboardData.avg_attendance}%` : '—'}
                        </span>
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
                      <div key={cls.assignment_id} className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm hover:border-green-400 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{cls.classroom__name}</p>
                            <p className="text-sm text-gray-600 truncate">{cls.subject__name}</p>
                          </div>
                          <button
                            onClick={() => navigate('/teacher/attendance', { state: { classroom: cls.classroom__name, subject: cls.subject__name } })}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            Take Attendance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<BookOpen className="w-16 h-16 text-gray-400" />}
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
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#15803D' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#166534'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#15803D'}
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
                    icon={<CheckSquare className="w-16 h-16 text-gray-400" />}
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
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#15803D' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#166534'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#15803D'}
                    >
                      View All →
                    </button>
                  )}
                </div>
                {dashboardData.high_risk_students?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.high_risk_students.slice(0, 5).map((student, idx) => (
                      <div key={`overview-student-${student.student__student_id || idx}`} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm hover:border-red-400 transition">
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
                            className="px-3 py-1.5 bg-transparent border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition text-xs font-medium whitespace-nowrap"
                          >
                            Message FM
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrendingUp className="w-16 h-16 text-gray-400" />}
                    title="No High-Risk Students"
                    message="Excellent! All students are performing well. Keep up the great work!"
                  />
                )}
              </div>
            </>
          )}

          {activeTab === "alerts" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
                  <Bell className="w-7 h-7 text-orange-600" />
                  All Alerts
                </h1>
                <p className="text-sm text-gray-600 mt-1">Monitor and manage student risk alerts</p>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  />
                  <select
                    value={filterRisk}
                    onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mt-3">
                  {(searchTerm || filterRisk) && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilterRisk(''); setCurrentPage(1); }}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#16A34A' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#15803D'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#16A34A'}
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
                    className="ml-auto px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                    style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
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
                      <div className="space-y-4">
                        {paginatedAlerts.map((alert) => (
                          <div 
                            key={alert.alert_id} 
                            className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 transition-all" 
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F9FAFB';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }} 
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <span 
                                    className="px-3 py-1 rounded-full text-xs font-semibold border"
                                    style={{
                                      backgroundColor: alert.risk_level?.toLowerCase() === 'critical' ? '#FEF2F2' :
                                                       alert.risk_level?.toLowerCase() === 'high' ? '#FFF7ED' :
                                                       alert.risk_level?.toLowerCase() === 'medium' ? '#FEFCE8' :
                                                       '#F9FAFB',
                                      color: alert.risk_level?.toLowerCase() === 'critical' ? '#DC2626' :
                                             alert.risk_level?.toLowerCase() === 'high' ? '#EA580C' :
                                             alert.risk_level?.toLowerCase() === 'medium' ? '#CA8A04' :
                                             '#6B7280',
                                      borderColor: alert.risk_level?.toLowerCase() === 'critical' ? '#FECACA' :
                                                   alert.risk_level?.toLowerCase() === 'high' ? '#FED7AA' :
                                                   alert.risk_level?.toLowerCase() === 'medium' ? '#FEF08A' :
                                                   '#E5E7EB'
                                    }}
                                  >
                                    {alert.risk_level?.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500 capitalize">{alert.alert_type}</span>
                                </div>
                                <p className="text-base font-semibold text-gray-800 mb-1">{alert.student__full_name}</p>
                                <p className="text-sm text-gray-600">{alert.subject__name}</p>
                              </div>
                              {/* Issue 3 fix: Review Alert now navigates to messages page to contact form master */}
                              <button
                                onClick={() => navigate('/teacher/messages')}
                                className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
                                style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Review Alert
                              </button>
                            </div>
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
                  icon={<Bell className="w-16 h-16 text-gray-400" />}
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
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
                  <Users className="w-7 h-7 text-red-600" />
                  High Risk Students
                </h1>
                <p className="text-sm text-gray-600 mt-1">Students requiring immediate attention and intervention</p>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  />
                  <select
                    value={filterRisk}
                    onChange={(e) => { setFilterRisk(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mt-3">
                  {(searchTerm || filterRisk) && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilterRisk(''); setCurrentPage(1); }}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#16A34A' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#15803D'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#16A34A'}
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
                    className="ml-auto px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                    style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {paginatedStudents.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedStudents.map((student, idx) => (
                      <div 
                        key={`student-${student.student__student_id || idx}`} 
                        className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 transition-all"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }} 
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-semibold border"
                                style={{
                                  backgroundColor: student.risk_level?.toLowerCase() === 'critical' ? '#FEF2F2' :
                                                   student.risk_level?.toLowerCase() === 'high' ? '#FFF7ED' :
                                                   '#FEFCE8',
                                  color: student.risk_level?.toLowerCase() === 'critical' ? '#DC2626' :
                                         student.risk_level?.toLowerCase() === 'high' ? '#EA580C' :
                                         '#CA8A04',
                                  borderColor: student.risk_level?.toLowerCase() === 'critical' ? '#FECACA' :
                                               student.risk_level?.toLowerCase() === 'high' ? '#FED7AA' :
                                               '#FEF08A'
                                }}
                              >
                                {student.risk_level?.toUpperCase()}
                              </span>
                              <span className="text-xs" style={{ color: '#6B7280', fontSize: '13px' }}>Risk Score: {student.risk_score}</span>
                            </div>
                            <p className="text-base font-semibold text-gray-800 mb-1">{student.student__full_name}</p>
                            <p className="text-sm text-gray-600">ID: {student.student__student_id} | Admission #: {student.student__admission_number}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowEscalateModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
                              style={{ backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Message FM
                            </button>
                            {/* Issue 2 fix: View Details navigates to attendance history for this student */}
                            <button
                              onClick={() => navigate(`/teacher/attendance-history/${student.student__student_id}`)}
                              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
                              style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                            >
                              <Users className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          </div>
                        </div>
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
                  icon={<AlertTriangle className="w-16 h-16 text-gray-400" />}
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Message Form Master</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Student: <span className="font-semibold text-gray-900">{selectedStudent.student__full_name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Risk Level: <span className={`font-semibold ${
                selectedStudent.risk_level === 'critical' ? 'text-red-600' : 'text-orange-600'
              }`}>{selectedStudent.risk_level?.toUpperCase()}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message to Form Master *</label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Describe your concerns about this student..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
                {escalating ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal removed — teachers use /teacher/messages route directly */}
    </div>
  );
}
