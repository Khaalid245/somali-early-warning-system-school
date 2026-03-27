import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import ErrorBoundary from "../components/ErrorBoundary";
import { showToast } from "../utils/toast";

// Components
import ExecutiveKPIs from "./components/ExecutiveKPIs";
import RiskIntelligence from "./components/RiskIntelligence";
import EscalationPanel from "./components/EscalationPanel";
import PerformanceMetrics from "./components/PerformanceMetrics";
import AlertManagement from "./components/AlertManagement";
import ActivityFeed from "./components/ActivityFeed";
import GovernanceView from "./components/GovernanceView";
import StudentsView from "./components/StudentsView";
import AuditLogViewer from "./components/AuditLogViewer";
import ReportsView from "./components/ReportsView";
import TimetableManager from "./TimetableTest";

function AdminDashboardContent() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/admin/");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      showToast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={handleTabChange} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
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
          <button onClick={loadDashboard} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabChange} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-8 space-y-8">
          {activeTab === "timetable" && (
            <TimetableManager />
          )}
          
          {activeTab === "overview" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Today's Overview</h1>
                  <p className="text-sm text-gray-500">School-wide attendance and intervention status</p>
                </div>
                <button 
                  onClick={loadDashboard} 
                  className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Refresh
                </button>
              </div>

              {/* Executive KPIs */}
              <ExecutiveKPIs data={dashboardData} />

              {/* Risk Intelligence */}
              <RiskIntelligence data={dashboardData} />

              {/* Escalation Panel */}
              <EscalationPanel cases={dashboardData.escalated_cases || []} onRefresh={loadDashboard} />

              {/* Performance Metrics */}
              <PerformanceMetrics data={dashboardData.performance_metrics || []} />

              {/* Activity Feed */}
              <ActivityFeed activities={dashboardData.recent_activities || []} />
            </>
          )}

          {activeTab === "alerts" && (
            <AlertManagement data={dashboardData} onRefresh={loadDashboard} />
          )}

          {activeTab === "cases" && (
            <EscalationPanel cases={dashboardData.all_cases || []} onRefresh={loadDashboard} />
          )}

          {activeTab === "students" && (
            <StudentsView />
          )}

          {activeTab === "governance" && (
            <GovernanceView />
          )}

          {activeTab === "audit" && (
            <AuditLogViewer />
          )}

          {activeTab === "reports" && (
            <ReportsView data={dashboardData} />
          )}

          {/* Fallback for unknown tabs */}
          {!['overview', 'alerts', 'cases', 'students', 'governance', 'audit', 'reports', 'timetable', 'profile', 'settings'].includes(activeTab) && (
            <div className="p-6 bg-red-100 border border-red-400 rounded">
              <h2 className="text-red-800 font-bold">Unknown Tab: {activeTab}</h2>
              <p>This tab is not recognized. Available tabs: overview, alerts, cases, students, governance, audit, reports, timetable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}
