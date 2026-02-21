import { useEffect, useState, useContext, useRef } from "react";
import React from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import ErrorBoundary from "../components/ErrorBoundary";
import SectionErrorBoundary from "../components/SectionErrorBoundary";
import ConfirmDialog from "../components/ConfirmDialog";
import RiskLevelFilter from "../components/RiskLevelFilter";
import DateRangeFilter from "../components/DateRangeFilter";
import { showToast } from "../utils/toast";
import KPICards from "./components/KPICards";
import HighRiskStudentsTable from "./components/HighRiskStudentsTable";
import ClassroomStats from "./components/ClassroomStats";
import AlertsList from "./components/AlertsList";
import CasesTable from "./components/CasesTable";
import UrgentBanner from "./components/UrgentBanner";
import ImmediateAttentionWidget from "./components/ImmediateAttentionWidget";
import ProgressionTracking from "./components/ProgressionTracking";
import AttendanceOverview from "./components/AttendanceOverview";
import DailyAttendanceMonitor from "./components/DailyAttendanceMonitor";
import { getBadgeColors, getTrendHelpers } from "./utils/helpers";
import { sanitizeDashboardData } from "./utils/dataValidation";
import { useActionLoading } from "../hooks/useActionLoading";
import { useSmartPolling } from "../hooks/useSmartPolling";
import { usePagination } from "../hooks/usePagination";
import { useDebounce } from "../hooks/useDebounce";
import { logAuditTrail } from "../utils/auditTrail";
import { performanceMonitor } from "../utils/performance";
import { errorTracker } from "../utils/errorTracker";
import { apiRateLimiter } from "../utils/rateLimiter";

function FormMasterDashboardContent() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const { setLoading: setActionLoading, isLoading } = useActionLoading();
  const isMountedRef = useRef(true);

  // Handle tab changes from sidebar
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const loadDashboard = async () => {
    const userId = user?.id || 'anonymous';
    
    if (!apiRateLimiter.isAllowed(userId)) {
      showToast.error('Too many requests. Please wait.');
      return;
    }

    performanceMonitor.start('dashboard-load');
    try {
      const res = await api.get("/interventions/dashboard/");
      if (isMountedRef.current) {
        const sanitizedData = sanitizeDashboardData(res.data);
        setDashboardData(sanitizedData);
        performanceMonitor.end('dashboard-load');
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
      errorTracker.captureException(err, { action: 'loadDashboard' });
      if (isMountedRef.current) {
        showToast.error('Failed to load dashboard data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const studentsPagination = usePagination(
    selectedRiskFilter === 'all' 
      ? dashboardData?.high_risk_students 
      : dashboardData?.high_risk_students?.filter(s => s.risk_level === selectedRiskFilter),
    20
  );
  
  // Filter cases by date range
  const filteredCases = React.useMemo(() => {
    if (!dashboardData?.pending_cases) return [];
    if (!dateRange.start && !dateRange.end) return dashboardData.pending_cases;
    
    return dashboardData.pending_cases.filter(c => {
      const caseDate = new Date(c.created_at);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      
      if (start && caseDate < start) return false;
      if (end && caseDate > end) return false;
      return true;
    });
  }, [dashboardData?.pending_cases, dateRange]);
  const [debouncedRefresh] = useDebounce(loadDashboard, 500);

  useSmartPolling(loadDashboard, 60000);

  useEffect(() => {
    loadDashboard();
    const sessionId = Date.now().toString();
    sessionStorage.setItem('sessionId', sessionId);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleAlertAction = async (alertId, newStatus) => {
    setActionLoading(`alert-${alertId}`, true);
    
    // Optimistic update
    const previousAlerts = dashboardData.urgent_alerts;
    setDashboardData(prev => ({
      ...prev,
      urgent_alerts: prev.urgent_alerts.map(alert => 
        alert.alert_id === alertId ? { ...alert, status: newStatus } : alert
      )
    }));

    try {
      await api.patch(`/alerts/${alertId}/`, { status: newStatus });
      if (isMountedRef.current) {
        logAuditTrail('ALERT_STATUS_CHANGE', { alertId, newStatus });
        showToast.success(`Alert ${newStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      // Rollback on error
      if (isMountedRef.current) {
        setDashboardData(prev => ({ ...prev, urgent_alerts: previousAlerts }));
        showToast.error(err.response?.data?.error || 'Failed to update alert');
      }
    } finally {
      setActionLoading(`alert-${alertId}`, false);
    }
  };

  const handleCreateCase = (student) => {
    showToast.info(`Create case for ${student.student__full_name}`);
  };

  const handleUpdateProgress = async (caseId, formData) => {
    setActionLoading(`progress-${caseId}`, true);
    
    // Optimistic update
    const previousCases = dashboardData.pending_cases;
    const currentCase = previousCases.find(c => c.case_id === caseId);
    
    setDashboardData(prev => ({
      ...prev,
      pending_cases: prev.pending_cases.map(c => 
        c.case_id === caseId ? { ...c, ...formData } : c
      )
    }));

    try {
      await api.patch(`/interventions/cases/${caseId}/`, {
        ...formData,
        version: currentCase?.version  // Send version for race condition check
      });
      if (isMountedRef.current) {
        logAuditTrail('CASE_PROGRESS_UPDATE', { caseId, progressStatus: formData.progress_status });
        showToast.success('Progress updated successfully');
      }
    } catch (err) {
      // Rollback on error
      if (isMountedRef.current) {
        setDashboardData(prev => ({ ...prev, pending_cases: previousCases }));
        if (err.response?.status === 409) {
          showToast.error('Case was modified by another user. Refreshing...');
          loadDashboard();
        } else {
          showToast.error(err.response?.data?.error || 'Failed to update progress');
        }
      }
    } finally {
      setActionLoading(`progress-${caseId}`, false);
    }
  };

  const handleEscalateToAdmin = async (caseId, reason) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Escalate Case to Admin',
      message: 'This will escalate the case to administration for family contact. This action cannot be undone. Continue?',
      danger: true,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false });
        performEscalation(caseId, reason);
      }
    });
  };

  const performEscalation = async (caseId, reason) => {
    setActionLoading(`escalate-${caseId}`, true);
    
    // Optimistic update
    const previousCases = dashboardData.pending_cases;
    const currentCase = previousCases.find(c => c.case_id === caseId);
    
    setDashboardData(prev => ({
      ...prev,
      pending_cases: prev.pending_cases.map(c => 
        c.case_id === caseId ? { ...c, status: 'escalated_to_admin', escalation_reason: reason } : c
      )
    }));

    try {
      await api.patch(`/interventions/cases/${caseId}/`, {
        status: 'escalated_to_admin',
        escalation_reason: reason,
        version: currentCase?.version
      });
      if (isMountedRef.current) {
        logAuditTrail('CASE_ESCALATED', { caseId, reason });
        showToast.success('Case escalated to admin for family contact');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setDashboardData(prev => ({ ...prev, pending_cases: previousCases }));
        if (err.response?.status === 409) {
          showToast.error('Case was modified by another user. Refreshing...');
          loadDashboard();
        } else {
          showToast.error(err.response?.data?.error || 'Failed to escalate case');
        }
      }
    } finally {
      setActionLoading(`escalate-${caseId}`, false);
    }
  };

  const { getRiskBadgeColor, getAlertStatusBadgeColor, getCaseStatusBadgeColor } = getBadgeColors();
  const { getTrendIcon, getTrendColor } = getTrendHelpers();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabChange} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-8 space-y-8">
          {activeTab === "overview" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Support Center</h1>
                  <p className="text-sm sm:text-base text-gray-600">Monitor and support student success</p>
                </div>
                <button 
                  onClick={debouncedRefresh} 
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  aria-label="Refresh dashboard data"
                >
                  Refresh Data
                </button>
              </div>

              <SectionErrorBoundary>
                <UrgentBanner data={dashboardData} />
              </SectionErrorBoundary>
              
              <SectionErrorBoundary>
                <KPICards 
                  data={{
                    ...dashboardData,
                    statistics: {
                      ...dashboardData.statistics,
                      trend_percentage: dashboardData.statistics?.trends?.new_cases_trend || 0
                    }
                  }} 
                  getTrendIcon={getTrendIcon} 
                  getTrendColor={getTrendColor} 
                />
              </SectionErrorBoundary>
              
              {dashboardData.immediate_attention?.length > 0 && (
                <SectionErrorBoundary>
                  <ImmediateAttentionWidget students={dashboardData.immediate_attention} getRiskBadgeColor={getRiskBadgeColor} />
                </SectionErrorBoundary>
              )}
              
              {studentsPagination.items?.length > 0 && (
                <SectionErrorBoundary>
                  <div className="mb-4">
                    <RiskLevelFilter 
                      selectedRisk={selectedRiskFilter} 
                      onFilterChange={setSelectedRiskFilter} 
                    />
                  </div>
                  <HighRiskStudentsTable 
                    students={studentsPagination.items.map(s => ({
                      ...s,
                      className: s.is_overdue ? 'bg-red-50' : ''
                    }))} 
                    getRiskBadgeColor={getRiskBadgeColor}
                    onCreateCase={handleCreateCase}
                  />
                  {studentsPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button
                        onClick={studentsPagination.prevPage}
                        disabled={!studentsPagination.hasPrev}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {studentsPagination.currentPage} of {studentsPagination.totalPages}
                      </span>
                      <button
                        onClick={studentsPagination.nextPage}
                        disabled={!studentsPagination.hasNext}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </SectionErrorBoundary>
              )}
              
              {dashboardData.classroom_stats?.length > 0 && (
                <SectionErrorBoundary>
                  <ClassroomStats classrooms={dashboardData.classroom_stats} />
                </SectionErrorBoundary>
              )}
            </>
          )}

          {activeTab === "alerts" && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Assigned Alerts</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200" role="region" aria-label="Assigned alerts list">
                <AlertsList 
                  alerts={dashboardData.urgent_alerts || []}
                  getRiskBadgeColor={getRiskBadgeColor}
                  getAlertStatusBadgeColor={getAlertStatusBadgeColor}
                  onAlertAction={handleAlertAction}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}

          {activeTab === "cases" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Intervention Cases</h3>
                <DateRangeFilter
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onStartChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                  onEndChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                  onClear={() => setDateRange({ start: '', end: '' })}
                />
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200" role="region" aria-label="Intervention cases table">
                <CasesTable 
                  cases={filteredCases} 
                  getCaseStatusBadgeColor={getCaseStatusBadgeColor} 
                />
              </div>
            </>
          )}

          {activeTab === "students" && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Students Needing Support</h3>
              <div role="region" aria-label="Students needing support table">
                <HighRiskStudentsTable 
                  students={dashboardData.high_risk_students || []} 
                  getRiskBadgeColor={getRiskBadgeColor}
                  onCreateCase={handleCreateCase}
                />
              </div>
            </>
          )}

          {activeTab === "progression" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Progression Tracking</h1>
                <p className="text-gray-600">Monitor intervention effectiveness and student improvement</p>
              </div>
              <div role="region" aria-label="Student progression tracking">
                <ProgressionTracking 
                  cases={dashboardData.pending_cases || []} 
                  getRiskBadgeColor={getRiskBadgeColor}
                  onUpdateProgress={handleUpdateProgress}
                  onEscalate={handleEscalateToAdmin}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}

          {activeTab === "attendance" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
                <p className="text-gray-600">View all students attendance records and history</p>
              </div>
              <div role="region" aria-label="Attendance overview">
                <AttendanceOverview />
              </div>
            </>
          )}

          {activeTab === "daily-monitor" && (
            <>
              <div role="region" aria-label="Daily attendance monitor">
                <DailyAttendanceMonitor />
              </div>
            </>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}

export default function FormMasterDashboard() {
  return (
    <ErrorBoundary>
      <FormMasterDashboardContent />
    </ErrorBoundary>
  );
}
