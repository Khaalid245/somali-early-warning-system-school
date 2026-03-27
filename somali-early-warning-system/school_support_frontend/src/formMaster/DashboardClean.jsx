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
import ReviewModal from "./components/ReviewModal";
import CreateCaseModal from "./components/CreateCaseModal";
import CasesTable from "./components/CasesTable";
import UrgentBanner from "./components/UrgentBanner";
import ImmediateAttentionWidget from "./components/ImmediateAttentionWidget";
import AttendanceOverview from "./components/AttendanceOverview";
import DailyAttendanceMonitor from "./components/DailyAttendanceMonitor";
import ChartsVisualization from "./components/ChartsVisualization";
import AIInsightsPanel from "./AIInsightsPanel";
import BulkAnalysisPanel from "./BulkAnalysisPanel";
import WeeklyReportPanel from "./WeeklyReportPanel";
import ProgressDashboard from "./ProgressDashboard";
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

  const existingCaseStudentIds = React.useMemo(
    () => (dashboardData?.pending_cases || []).map(c => c.student),
    [dashboardData?.pending_cases]
  );

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

  const [createCaseStudent,   setCreateCaseStudent]   = useState(null);
  const [createCaseSubmitting, setCreateCaseSubmitting] = useState(false);

  const handleCreateCase = (student) => setCreateCaseStudent(student);

  const handleCreateCaseConfirm = async ({ observation, urgency, followUp }) => {
    setCreateCaseSubmitting(true);
    try {
      const res = await api.post('/interventions/', {
        student:       createCaseStudent.student__student_id,
        status:        'open',
        outcome_notes: `[Urgency: ${urgency}] ${observation}`,
        ...(followUp && { follow_up_date: followUp }),
      });
      showToast.success(`Case #${res.data?.case_id} created for ${createCaseStudent.student__full_name}`);
      setCreateCaseStudent(null);
      loadDashboard();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.student?.[0] ||
        err?.response?.data?.error ||
        'Failed to create case';
      showToast.error(msg);
    } finally {
      setCreateCaseSubmitting(false);
    }
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
      await api.patch(`/interventions/${caseId}/`, {
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
      await api.patch(`/interventions/${caseId}/`, {
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

  const [reviewAlert, setReviewAlert] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleReview = (alert) => setReviewAlert(alert);

  const handleReviewConfirm = async ({ observation, urgency, followUp }) => {
    setReviewSubmitting(true);
    try {
      await api.patch(`/alerts/${reviewAlert.alert_id}/`, { status: 'under_review' });
      const casePayload = {
        student:           reviewAlert.student,
        alert:             reviewAlert.alert_id,
        status:            'in_progress',
        outcome_notes:     observation,
        escalation_reason: `Urgency: ${urgency}. Initial observation: ${observation}`,
        ...(followUp && { follow_up_date: followUp }),
      };
      const caseRes = await api.post('/interventions/', casePayload);
      const caseId  = caseRes.data?.case_id;
      showToast.success(caseId ? `Review started — Case #${caseId} created` : 'Review started');
      setReviewAlert(null);
      loadDashboard();
    } catch (err) {
      showToast.error(err?.response?.data?.detail || err?.response?.data?.error || 'Failed to start review');
    } finally {
      setReviewSubmitting(false);
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
          <button onClick={loadDashboard} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 space-y-4 sm:space-y-6">
          {activeTab === "overview" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Form Master Dashboard</h1>
                  <p className="text-sm sm:text-base text-gray-500">
                    Classroom overview &nbsp;·&nbsp;
                    Data as of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={debouncedRefresh} 
                  className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
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
                  <ImmediateAttentionWidget students={dashboardData.immediate_attention} getRiskBadgeColor={getRiskBadgeColor} onCreateCase={handleCreateCase} />
                </SectionErrorBoundary>
              )}
              
              {studentsPagination.items?.length > 0 ? (
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
                    existingCaseStudentIds={existingCaseStudentIds}
                  />
                  {studentsPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button
                        onClick={studentsPagination.prevPage}
                        disabled={!studentsPagination.hasPrev}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {studentsPagination.currentPage} of {studentsPagination.totalPages}
                      </span>
                      <button
                        onClick={studentsPagination.nextPage}
                        disabled={!studentsPagination.hasNext}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors font-medium"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </SectionErrorBoundary>
              ) : dashboardData.high_risk_students?.length > 0 && selectedRiskFilter !== 'all' ? (
                <SectionErrorBoundary>
                  <div className="mb-4">
                    <RiskLevelFilter 
                      selectedRisk={selectedRiskFilter} 
                      onFilterChange={setSelectedRiskFilter} 
                    />
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">High-Risk Students</h3>
                    </div>
                    <div className="p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">No {selectedRiskFilter.charAt(0).toUpperCase() + selectedRiskFilter.slice(1)} Risk Students</h4>
                        <p className="text-gray-600 mb-4">No students match the selected risk level filter. Try selecting a different risk level or clear the filter.</p>
                        <button
                          onClick={() => setSelectedRiskFilter('all')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Show All Students
                        </button>
                      </div>
                    </div>
                  </div>
                </SectionErrorBoundary>
              ) : (
                <SectionErrorBoundary>
                  <div className="mb-4">
                    <RiskLevelFilter 
                      selectedRisk={selectedRiskFilter} 
                      onFilterChange={setSelectedRiskFilter} 
                    />
                  </div>
                  <HighRiskStudentsTable 
                    students={[]} 
                    getRiskBadgeColor={getRiskBadgeColor}
                    onCreateCase={handleCreateCase}
                    existingCaseStudentIds={existingCaseStudentIds}
                  />
                </SectionErrorBoundary>
              )}
              
              {dashboardData.classroom_stats?.length > 0 && (
                <SectionErrorBoundary>
                  <ClassroomStats classrooms={dashboardData.classroom_stats} />
                </SectionErrorBoundary>
              )}

              <SectionErrorBoundary>
                <ChartsVisualization dashboardData={dashboardData} />
              </SectionErrorBoundary>
            </>
          )}

          {activeTab === "alerts" && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Assigned Alerts</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200" role="region" aria-label="Assigned alerts list">
                <AlertsList 
                  alerts={dashboardData.urgent_alerts || []}
                  onReview={handleReview}
                  onAlertAction={handleAlertAction}
                  loadingKey={null}
                />
              </div>
            </>
          )}

          {activeTab === "cases" && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Intervention Cases</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Cases open &gt;14 days without update are marked overdue &nbsp;·&nbsp;
                    Showing {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
                    {(dateRange.start || dateRange.end) && (
                      <span className="ml-1 text-green-700 font-medium">(filtered by date)</span>
                    )}
                  </p>
                </div>
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
                  onRefresh={loadDashboard}
                />
              </div>
            </>
          )}

          {activeTab === "students" && (
            <div role="region" aria-label="Students needing support table">
              <HighRiskStudentsTable 
                students={dashboardData.high_risk_students || []} 
                getRiskBadgeColor={getRiskBadgeColor}
                onCreateCase={handleCreateCase}
                existingCaseStudentIds={existingCaseStudentIds}
              />
            </div>
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

          {activeTab === "ai-insights" && <AIInsightsPanel aiInsights={dashboardData.ai_insights || []} classroomSummary={dashboardData.classroom_summary || null} />}

          {activeTab === "bulk-analysis" && <BulkAnalysisPanel />}

          {activeTab === "weekly-report" && <WeeklyReportPanel />}

          {activeTab === "progress-tracking" && <ProgressDashboard />}
        </div>
        </div>
      </div>
      
      {reviewAlert && (
        <ReviewModal
          alert={reviewAlert}
          onConfirm={handleReviewConfirm}
          onClose={() => setReviewAlert(null)}
          isSubmitting={reviewSubmitting}
        />
      )}

      {createCaseStudent && (
        <CreateCaseModal
          student={createCaseStudent}
          onConfirm={handleCreateCaseConfirm}
          onClose={() => setCreateCaseStudent(null)}
          isSubmitting={createCaseSubmitting}
        />
      )}

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
