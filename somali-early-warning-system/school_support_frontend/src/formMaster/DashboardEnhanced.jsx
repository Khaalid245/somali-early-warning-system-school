import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, TableSkeleton, PageSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../utils/toast";
import { getUserFriendlyError, operationErrors } from "../utils/errorMessages";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import OfflineIndicator from "../components/OfflineIndicator";
import CreateCaseModal from "./components/CreateCaseModal";
import StudentDetailModal from "./components/StudentDetailModal";
import CaseDetailModal from "./components/CaseDetailModal";
import SearchFilter from "./components/SearchFilter";
import DateRangeFilter from "./components/DateRangeFilter";
import TablePagination from "../components/TablePagination";
import ChartsVisualization from "./components/ChartsVisualization";
import ProgressionTracking from "./components/ProgressionTracking";
import DailyMonitor from "./components/DailyMonitor";
import AlertHistory from "./components/AlertHistory";
import { StudentCard, AlertCard, CaseCard, MobileKPICard } from "./components/MobileComponents";
import { MobileLayout, MobileStatsGrid, MobileSection } from "./components/MobileLayout";
import { useNotifications, NotificationSettings } from "./components/NotificationManager";
import { RefreshCw, Menu } from "lucide-react";
import "./styles/mobile.css";

export default function FormMasterDashboardEnhanced() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  
  // Notifications
  const { permission, requestPermission } = useNotifications(dashboardData);
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  
  // Filter states with localStorage persistence
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('fm_searchTerm') || "";
  });
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('fm_filters');
    return saved ? JSON.parse(saved) : { riskLevel: "", status: "", classroom: "" };
  });
  const [dateRange, setDateRange] = useState(() => {
    const saved = localStorage.getItem('fm_dateRange');
    return saved ? JSON.parse(saved) : { startDate: "", endDate: "" };
  });
  
  // Bulk actions state
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isProcessing: false });
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('fm_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('fm_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('fm_dateRange', JSON.stringify(dateRange));
  }, [dateRange]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      loadDashboard();
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      
      const res = await api.get(`/dashboard/?${params.toString()}`);
      setDashboardData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
      showToast.error(getUserFriendlyError(err) || operationErrors.loadDashboard);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
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

  const handleAlertAction = async (alertId, newStatus) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Update Alert Status',
      message: `Are you sure you want to mark this alert as "${newStatus.replace('_', ' ')}"?`,
      danger: false,
      onConfirm: () => performAlertAction(alertId, newStatus)
    });
  };

  const performAlertAction = async (alertId, newStatus) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setActionLoading(true);
    try {
      await api.patch(`/alerts/${alertId}/`, { status: newStatus });
      showToast.success(`Alert successfully marked as ${newStatus.replace('_', ' ')}`);
      loadDashboard();
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || operationErrors.updateAlert);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      showToast.error('No students to export. Please adjust your filters.');
      return;
    }

    const csv = [
      ['Student ID', 'Name', 'Classroom', 'Risk Level', 'Attendance %', 'Days Missed'].join(','),
      ...filteredStudents.map(s => [
        s.student__student_id,
        `"${s.student__full_name}"`,
        s.classroom,
        s.risk_level,
        s.attendance_rate,
        s.absent_count
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filterInfo = searchTerm || filters.riskLevel ? '_filtered' : '';
    a.download = `high_risk_students${filterInfo}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success(`Successfully exported ${filteredStudents.length} student(s) to CSV`);
  };

  const handleBulkAlertAction = async (newStatus) => {
    if (selectedAlerts.length === 0) {
      showToast.error('Please select at least one alert to update');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Bulk Update Alerts',
      message: `Are you sure you want to mark ${selectedAlerts.length} alert(s) as "${newStatus.replace('_', ' ')}"? This action will update all selected alerts.`,
      danger: false,
      onConfirm: () => performBulkAlertAction(newStatus)
    });
  };

  const performBulkAlertAction = async (newStatus) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setActionLoading(true);
    setBulkProgress({ current: 0, total: selectedAlerts.length, isProcessing: true });
    
    try {
      let completed = 0;
      const errors = [];
      
      for (const alertId of selectedAlerts) {
        try {
          await api.patch(`/alerts/${alertId}/`, { status: newStatus });
          completed++;
          setBulkProgress({ current: completed, total: selectedAlerts.length, isProcessing: true });
        } catch (err) {
          errors.push(alertId);
        }
      }
      
      if (errors.length === 0) {
        showToast.success(`Successfully updated ${completed} alert(s) to ${newStatus.replace('_', ' ')}`);
      } else {
        showToast.warning(`Updated ${completed} of ${selectedAlerts.length} alerts. ${errors.length} failed.`);
      }
      
      setSelectedAlerts([]);
      loadDashboard();
    } catch (err) {
      showToast.error(getUserFriendlyError(err) || 'Failed to update alerts. Please try again.');
    } finally {
      setActionLoading(false);
      setBulkProgress({ current: 0, total: 0, isProcessing: false });
    }
  };

  const toggleAlertSelection = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === dashboardData.urgent_alerts?.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(dashboardData.urgent_alerts?.map(a => a.alert_id) || []);
    }
  };

  // Filter and search logic
  const filteredStudents = useMemo(() => {
    if (!dashboardData?.high_risk_students) return [];
    
    let filtered = [...dashboardData.high_risk_students];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.student__full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student__student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Risk level filter
    if (filters.riskLevel) {
      filtered = filtered.filter(s => s.risk_level === filters.riskLevel);
    }
    
    return filtered;
  }, [dashboardData?.high_risk_students, searchTerm, filters]);

  // Pagination logic
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Mobile content renderer
  const renderMobileContent = () => {
    if (activeTab === "overview") {
      return (
        <>
          <MobileStatsGrid>
            <MobileKPICard icon="🔔" label="Alerts" value={dashboardData.assigned_alerts || 0} 
              trend={dashboardData.alert_trend_direction} trendValue={dashboardData.alert_change_percent} />
            <MobileKPICard icon="📋" label="Cases" value={dashboardData.open_cases || 0} 
              trend={dashboardData.case_trend_direction} trendValue={dashboardData.case_change_percent} />
            <MobileKPICard icon="⚠️" label="High Risk" value={dashboardData.high_risk_count || 0} />
            <MobileKPICard icon="🚨" label="Escalated" value={dashboardData.escalated_cases || 0} />
          </MobileStatsGrid>

          <MobileSection title="High-Risk Students" subtitle="Tap to view details or create case">
            <div className="space-y-3">
              {paginatedStudents.map(student => (
                <StudentCard
                  key={student.student__student_id}
                  student={student}
                  onCreateCase={(s) => { setSelectedStudent(s); setShowCreateCase(true); }}
                  onViewDetails={(s) => { setSelectedStudent(s); setShowStudentDetail(true); }}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-4">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStudents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </MobileSection>
        </>
      );
    }

    if (activeTab === "alerts") {
      return (
        <>
          <MobileStatsGrid>
            <MobileKPICard icon="📊" label="Total" value={dashboardData.urgent_alerts?.length || 0} />
            <MobileKPICard icon="🔴" label="Critical" value={dashboardData.urgent_alerts?.filter(a => a.risk_level === 'critical').length || 0} />
            <MobileKPICard icon="🟠" label="High" value={dashboardData.urgent_alerts?.filter(a => a.risk_level === 'high').length || 0} />
            <MobileKPICard icon="🟡" label="Active" value={dashboardData.urgent_alerts?.filter(a => a.status === 'active').length || 0} />
          </MobileStatsGrid>

          {selectedAlerts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {bulkProgress.isProcessing ? (
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Processing {bulkProgress.current} of {bulkProgress.total} alerts...
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-blue-900 mb-2">{selectedAlerts.length} selected</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleBulkAlertAction('under_review')} className="flex-1 py-2 bg-yellow-600 text-white rounded-lg font-medium text-sm">
                      Review
                    </button>
                    <button onClick={() => handleBulkAlertAction('resolved')} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm">
                      Resolve
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <MobileSection title="Assigned Alerts" subtitle="Priority sorted">
            <div className="space-y-3">
              {dashboardData.urgent_alerts?.map(alert => (
                <AlertCard
                  key={alert.alert_id}
                  alert={alert}
                  selected={selectedAlerts.includes(alert.alert_id)}
                  onToggle={toggleAlertSelection}
                  onAction={handleAlertAction}
                />
              ))}
            </div>
          </MobileSection>
        </>
      );
    }

    if (activeTab === "cases") {
      return (
        <MobileSection title="Intervention Cases" subtitle="Cases >14 days are overdue">
          <div className="space-y-3">
            {dashboardData.pending_cases?.map(caseItem => (
              <CaseCard
                key={caseItem.case_id}
                caseItem={caseItem}
                onViewDetails={(id) => { setSelectedCase(id); setShowCaseDetail(true); }}
              />
            ))}
          </div>
        </MobileSection>
      );
    }

    if (activeTab === "students") {
      return (
        <MobileSection title="High-Risk Students">
          <div className="space-y-3">
            {paginatedStudents.map(student => (
              <StudentCard
                key={student.student__student_id}
                student={student}
                onCreateCase={(s) => { setSelectedStudent(s); setShowCreateCase(true); }}
                onViewDetails={(s) => { setSelectedStudent(s); setShowStudentDetail(true); }}
              />
            ))}
          </div>
        </MobileSection>
      );
    }

    if (activeTab === "progression") return <ProgressionTracking />;
    if (activeTab === "daily-monitor") return <DailyMonitor />;
    if (activeTab === "alert-history") return <AlertHistory />;
  };

  // Desktop content renderer (existing content)
  const renderDesktopContent = () => (
    <>
          {activeTab === "overview" && (
            <>
              {/* Header with Date Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Classroom Risk Control Center</h1>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Monitor and manage student interventions</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={loadDashboard}
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

              {/* Date Range Filter */}
              <div className="mb-4">
                <DateRangeFilter onDateChange={setDateRange} />
              </div>

              {/* Additional KPI Metrics */}
              {dashboardData.avg_resolution_time !== undefined && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">⏱️</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Avg Resolution</p>
                        <p className="text-lg font-bold text-gray-900">{dashboardData.avg_resolution_time} days</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✅</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Success Rate</p>
                        <p className="text-lg font-bold text-gray-900">{dashboardData.case_success_rate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📈</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Attendance Improvement</p>
                        <p className="text-lg font-bold text-gray-900">{dashboardData.attendance_improvement_rate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎯</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Effectiveness Score</p>
                        <p className="text-lg font-bold text-gray-900">{dashboardData.intervention_effectiveness_score}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💼</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Workload</p>
                        <p className={`text-lg font-bold ${
                          dashboardData.workload_indicator?.status === 'high' ? 'text-red-600' :
                          dashboardData.workload_indicator?.status === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                        }`}>{dashboardData.workload_indicator?.status?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🔔</span>
                    </div>
                    {dashboardData.alert_change_percent !== undefined && (
                      <span className={`text-xs font-semibold ${
                        dashboardData.alert_trend_direction === 'down' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dashboardData.alert_trend_direction === 'up' ? '↑' : '↓'} {Math.abs(dashboardData.alert_change_percent)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mb-1">Assigned Alerts</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.assigned_alerts || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📋</span>
                    </div>
                    {dashboardData.case_change_percent !== undefined && (
                      <span className={`text-xs font-semibold ${
                        dashboardData.case_trend_direction === 'down' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dashboardData.case_trend_direction === 'up' ? '↑' : '↓'} {Math.abs(dashboardData.case_change_percent)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mb-1">Open Cases</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.open_cases || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">⚠️</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-1">High Risk Students</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.high_risk_count || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🚨</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-1">Escalated Cases</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.escalated_cases || 0}</p>
                </div>
              </div>

              {/* High-Risk Students Table with Search & Pagination */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">High-Risk Students</h3>
                    <p className="text-sm text-gray-500">Students requiring immediate intervention</p>
                  </div>
                  <button
                    onClick={handleExportStudents}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    <span>📥</span>
                    Export CSV
                  </button>
                </div>
                
                <SearchFilter 
                  onSearch={setSearchTerm}
                  onFilter={setFilters}
                  filters={filters}
                />

                {paginatedStudents.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Classroom</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Risk</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Attendance %</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Days Missed</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedStudents.map((student) => (
                            <tr key={student.student__student_id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowStudentDetail(true);
                                  }}
                                  className="text-left hover:text-blue-600 transition"
                                >
                                  <p className="font-medium text-sm text-gray-800">{student.student__full_name}</p>
                                  <p className="text-xs text-gray-500">ID: {student.student__student_id}</p>
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.classroom}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                                  {student.risk_level?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-base font-bold ${
                                  student.attendance_rate >= 80 ? 'text-green-600' :
                                  student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {student.attendance_rate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-base font-bold text-red-600">{student.absent_count}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowCreateCase(true);
                                  }}
                                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-medium whitespace-nowrap"
                                >
                                  Create Case
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredStudents.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                ) : (
                  <EmptyState
                    icon="👥"
                    title="No Students Found"
                    message={searchTerm || filters.riskLevel 
                      ? "No students match your current filters. Try adjusting your search criteria or clearing filters."
                      : "Great news! There are currently no high-risk students requiring intervention."}
                    actionLabel={searchTerm || filters.riskLevel ? "Clear Filters" : null}
                    onAction={() => {
                      setSearchTerm('');
                      setFilters({ riskLevel: '', status: '', classroom: '' });
                    }}
                  />
                )}
              </div>

              {/* Charts Visualization */}
              <ChartsVisualization dashboardData={dashboardData} />

              {/* Notification Settings */}
              <NotificationSettings permission={permission} requestPermission={requestPermission} />

              {/* Classroom Statistics */}
              {dashboardData.classroom_stats?.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">My Classrooms</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {dashboardData.classroom_stats.map((classroom) => (
                      <div key={classroom.classroom_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <h4 className="font-semibold text-gray-800 mb-3">{classroom.classroom_name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Students</span>
                            <span className="text-lg font-bold text-gray-900">{classroom.total_students}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Attendance Rate</span>
                            <span className={`text-lg font-bold ${
                              classroom.attendance_rate >= 80 ? 'text-green-600' :
                              classroom.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {classroom.attendance_rate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Absent (30d)</span>
                            <span className="text-lg font-bold text-red-600">{classroom.absent_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Late (30d)</span>
                            <span className="text-lg font-bold text-orange-600">{classroom.late_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Risk Score</span>
                            <span className={`text-lg font-bold ${
                              classroom.avg_risk_score >= 60 ? 'text-red-600' :
                              classroom.avg_risk_score >= 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {classroom.avg_risk_score}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              classroom.health_status === 'critical' ? 'bg-red-100 text-red-700' :
                              classroom.health_status === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {classroom.health_status?.toUpperCase()}
                            </span>
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
            <>
              {/* Alert Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.urgent_alerts?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Critical</p>
                  <p className="text-3xl font-bold text-red-600">
                    {dashboardData.urgent_alerts?.filter(a => a.risk_level === 'critical').length || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">High Priority</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {dashboardData.urgent_alerts?.filter(a => a.risk_level === 'high').length || 0}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
                  <p className="text-sm text-gray-600 mb-1">Active Status</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {dashboardData.urgent_alerts?.filter(a => a.status === 'active').length || 0}
                  </p>
                </div>
              </div>

              {/* Alert Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium"
                    >
                      Active Alerts
                    </button>
                    <button
                      onClick={() => setActiveTab('alert-history')}
                      className="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Alert History
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Assigned Alerts</h3>
                    <p className="text-sm text-gray-500">Sorted by priority: Critical → High → Medium → Low</p>
                  </div>
                  {selectedAlerts.length > 0 && (
                    <div className="flex items-center gap-2">
                      {bulkProgress.isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">
                            Processing {bulkProgress.current} of {bulkProgress.total}...
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">{selectedAlerts.length} selected</span>
                          <button
                            onClick={() => handleBulkAlertAction('under_review')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium disabled:opacity-50"
                          >
                            Mark as Review
                          </button>
                          <button
                            onClick={() => handleBulkAlertAction('resolved')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                          >
                            Mark as Resolved
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {dashboardData.urgent_alerts?.length > 0 ? (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAlerts.length === dashboardData.urgent_alerts?.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Select All</span>
                      </label>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {dashboardData.urgent_alerts.map((alert) => (
                        <div key={alert.alert_id} className="p-6 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedAlerts.includes(alert.alert_id)}
                              onChange={() => toggleAlertSelection(alert.alert_id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex items-center justify-between flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(alert.risk_level)}`}>
                                    {alert.risk_level?.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {alert.subject__name || 'General'}
                                  </span>
                                </div>
                                <p className="font-semibold text-gray-800">{alert.student__full_name}</p>
                                <p className="text-sm text-gray-600">ID: {alert.student__student_id}</p>
                              </div>
                              <div className="flex gap-2">
                                {alert.status === 'active' && (
                                  <button 
                                    onClick={() => handleAlertAction(alert.alert_id, 'under_review')}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition text-sm font-medium"
                                  >
                                    Review
                                  </button>
                                )}
                                {alert.status === 'under_review' && (
                                  <button 
                                    onClick={() => handleAlertAction(alert.alert_id, 'resolved')}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition text-sm font-medium"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="🔔"
                    title="No Active Alerts"
                    message="Excellent! There are no active alerts at this time. All students are being monitored effectively."
                  />
                )}
              </div>
            </>
          )}

          {activeTab === "alert-history" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Resolved Alerts History</h3>
                <p className="text-sm text-gray-500">Last 30 days of resolved and dismissed alerts</p>
              </div>
              <AlertHistory />
            </div>
          )}

          {activeTab === "cases" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Intervention Cases</h3>
                <p className="text-sm text-gray-500">Cases open &gt; 14 days are marked as overdue</p>
              </div>
              {dashboardData.pending_cases?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Case ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Days Open</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.pending_cases.map((caseItem) => (
                        <tr key={caseItem.case_id} className={`hover:bg-gray-50 transition ${caseItem.is_overdue ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3 font-mono text-sm">#{caseItem.case_id}</td>
                          <td className="px-4 py-3 text-sm">{caseItem.student__full_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {caseItem.status}
                              </span>
                              {caseItem.is_overdue && (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold text-sm ${caseItem.is_overdue ? 'text-red-600' : 'text-gray-700'}`}>
                              {caseItem.days_open} days
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(caseItem.case_id);
                                setShowCaseDetail(true);
                              }}
                              className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs whitespace-nowrap"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="📋"
                  title="No Pending Cases"
                  message="All intervention cases have been resolved or closed. Great work!"
                />
              )}
            </div>
          )}

          {activeTab === "progression" && (
            <ProgressionTracking />
          )}

          {activeTab === "daily-monitor" && (
            <DailyMonitor />
          )}

          {activeTab === "students" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">High-Risk Students</h3>
              </div>
              <SearchFilter onSearch={setSearchTerm} onFilter={setFilters} />
              {paginatedStudents.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Student</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Risk</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr key={student.student__student_id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentDetail(true);
                                }}
                                className="text-left hover:text-blue-600 text-sm"
                              >
                                {student.student__full_name}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(student.risk_level)}`}>
                                {student.risk_level?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-sm">{student.attendance_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredStudents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <EmptyState
                  icon="👥"
                  title="No Students Found"
                  message="No high-risk students match your current criteria."
                />
              )}
            </div>
          )}
    </>
  );

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={user} dashboardData={{}} />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
              <PageSkeleton />
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
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <OfflineIndicator />
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          {renderDesktopContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateCase && selectedStudent && (
        <CreateCaseModal
          student={selectedStudent}
          onClose={() => {
            setShowCreateCase(false);
            setSelectedStudent(null);
          }}
          onSuccess={() => {
            loadDashboard();
            setShowCreateCase(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {showStudentDetail && selectedStudent && (
        <StudentDetailModal
          studentId={selectedStudent.student__student_id}
          onClose={() => {
            setShowStudentDetail(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {showCaseDetail && selectedCase && (
        <CaseDetailModal
          caseId={selectedCase}
          onClose={() => {
            setShowCaseDetail(false);
            setSelectedCase(null);
          }}
          onUpdate={loadDashboard}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        loading={actionLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
