import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/shared/StatCard";
import InfoCard from "../components/shared/InfoCard";
import ActionButton from "../components/shared/ActionButton";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../utils/toast";
import GovernanceView from "./components/GovernanceView";
import StudentsView from "./components/StudentsView";
import AuditLogViewer from "./components/AuditLogViewer";
import ReportsView from "./components/ReportsView";

export default function AdminDashboardNew() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/admin/");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
      showToast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
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
          <p className="text-red-600 mb-4 text-lg">❌ Failed to load dashboard</p>
          <ActionButton icon="🔄" text="Try Again" onClick={loadDashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabChange} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-4 sm:p-8">
          {activeTab === "overview" && (
            <>
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <span className="text-4xl">🔑</span>
                    System Control Center
                  </h1>
                  <p className="text-gray-600">Monitor the entire school system</p>
                </div>
                <ActionButton icon="🔄" text="Refresh" onClick={loadDashboard} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                  icon="👥"
                  title="Total Students"
                  value={dashboardData.total_students || 0}
                  subtitle="Enrolled in system"
                  gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                  icon="👨‍🏫"
                  title="Active Teachers"
                  value={dashboardData.total_teachers || 0}
                  subtitle="Teaching staff"
                  gradient="from-green-500 to-green-600"
                />
                <StatCard
                  icon="🏫"
                  title="Classrooms"
                  value={dashboardData.total_classrooms || 0}
                  subtitle="Active classes"
                  gradient="from-purple-500 to-purple-600"
                />
                <StatCard
                  icon="🔔"
                  title="Active Alerts"
                  value={dashboardData.total_alerts || 0}
                  subtitle="Need attention"
                  gradient="from-orange-500 to-orange-600"
                />
                <StatCard
                  icon="📋"
                  title="Open Cases"
                  value={dashboardData.total_cases || 0}
                  subtitle="Interventions active"
                  gradient="from-red-500 to-red-600"
                />
                <StatCard
                  icon="⚠️"
                  title="High Risk Students"
                  value={dashboardData.high_risk_students || 0}
                  subtitle="Need urgent help"
                  gradient="from-pink-500 to-pink-600"
                />
              </div>

              {/* System Health */}
              <InfoCard
                icon="💚"
                title="System Health"
                subtitle="Overall system performance"
                headerGradient="from-green-600 to-green-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.attendance_rate || 0}%</p>
                    <p className="text-sm text-gray-600">Average Attendance</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.resolved_cases || 0}</p>
                    <p className="text-sm text-gray-600">Cases Resolved</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-4xl mb-2">⏱️</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.avg_response_time || 0}h</p>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                </div>
              </InfoCard>
            </>
          )}

          {activeTab === "governance" && <GovernanceView />}
          {activeTab === "students" && <StudentsView />}
          {activeTab === "audit" && <AuditLogViewer />}
          {activeTab === "reports" && <ReportsView data={dashboardData} />}
        </div>
      </div>
    </div>
  );
}
