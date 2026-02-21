import { useEffect, useState, useContext } from "react";
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
import SystemHealth from "./components/SystemHealth";
import GovernanceHardcoded from "./components/GovernanceHardcoded";
import StudentsView from "./components/StudentsView";
import AuditLogViewer from "./components/AuditLogViewer";
import ReportsView from "./components/ReportsView";

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

  const handleTabChange = (tab) => {
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
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">System Control Center</h1>
                  <p className="text-gray-600">Enterprise oversight and risk intelligence</p>
                </div>
                <button 
                  onClick={loadDashboard} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Refresh Data
                </button>
              </div>

              {/* Executive KPIs */}
              <ExecutiveKPIs data={dashboardData} />

              {/* System Health Score */}
              <SystemHealth data={dashboardData} />

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
            <GovernanceHardcoded />
          )}

          {activeTab === "audit" && (
            <AuditLogViewer />
          )}

          {activeTab === "reports" && (
            <ReportsView data={dashboardData} />
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
