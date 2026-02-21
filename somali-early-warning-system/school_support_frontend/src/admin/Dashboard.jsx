import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import { showToast } from "../utils/toast";

import ExecutiveKPIs from "./components/ExecutiveKPIs";
import SystemHealth from "./components/SystemHealth";
import RiskIntelligence from "./components/RiskIntelligence";
import EscalationPanel from "./components/EscalationPanel";
import PerformanceMetrics from "./components/PerformanceMetrics";
import ActivityFeed from "./components/ActivityFeed";
import AlertManagement from "./components/AlertManagement";
import StudentsView from "./components/StudentsView";
import AttendanceDrillDown from "./components/AttendanceDrillDown";
import AuditLogViewer from "./components/AuditLogViewer";
import ReportsView from "./components/ReportsView";
import UserManagement from "./components/UserManagement";
import ClassroomManagement from "./components/ClassroomManagement";

function AdminDashboardContent() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadDashboard = async () => {
    try {
      // Test simple endpoint first
      const testRes = await api.get("/dashboard/admin/test/");
      console.log("Test endpoint:", testRes.data);
      
      const res = await api.get("/dashboard/admin/");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      console.error("Error details:", err.response?.data);
      showToast.error(err.response?.data?.detail || "Failed to load dashboard data");
      setDashboardData({
        executive_kpis: {},
        system_health: {},
        risk_distribution: {},
        monthly_trends: { alerts: [], cases: [] },
        escalated_cases: [],
        performance_metrics: [],
        recent_activities: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
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
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-8 space-y-8">
          {activeTab === "overview" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    System Control Center
                  </h1>
                  <p className="text-gray-600">
                    Enterprise oversight and risk intelligence
                  </p>
                </div>
                <button
                  onClick={loadDashboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Refresh Data
                </button>
              </div>

              <ExecutiveKPIs data={dashboardData} />
              <SystemHealth data={dashboardData} />
              <RiskIntelligence data={dashboardData} />
              <EscalationPanel
                cases={dashboardData.escalated_cases || []}
                onRefresh={loadDashboard}
              />
              <PerformanceMetrics
                data={dashboardData.performance_metrics || []}
              />
              <AttendanceDrillDown />
              <ActivityFeed activities={dashboardData.recent_activities || []} />
            </>
          )}

          {activeTab === "alerts" && (
            <AlertManagement data={dashboardData} onRefresh={loadDashboard} />
          )}

          {activeTab === "cases" && (
            <EscalationPanel
              cases={dashboardData.escalated_cases || []}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "students" && (
            <StudentsView />
          )}

          {activeTab === "audit" && (
            <AuditLogViewer />
          )}

          {activeTab === "governance" && (
            <div className="space-y-6">
              <UserManagement />
              <ClassroomManagement />
            </div>
          )}

          {activeTab === "reports" && (
            <ReportsView />
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
