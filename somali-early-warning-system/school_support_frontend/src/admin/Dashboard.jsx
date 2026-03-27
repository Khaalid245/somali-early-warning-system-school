import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import { showToast } from "../utils/toast";

import ExecutiveKPIs from "./components/ExecutiveKPIs";
import RiskIntelligence from "./components/RiskIntelligence";
import EscalationPanel from "./components/EscalationPanel";
import PerformanceMetrics from "./components/PerformanceMetrics";
import ActivityFeed from "./components/ActivityFeed";
import AlertManagement from "./components/AlertManagement";
import StudentsView from "./components/StudentsView";
import AttendanceDrillDown from "./components/AttendanceDrillDown";
import AuditLogViewer from "./components/AuditLogViewer";
import ReportsView from "./components/ReportsView";
import GovernanceView from "./components/GovernanceView";
import SettingsView from "./components/SettingsView";
import TimetableManager from "./TimetableManager";
import QuickMessage from "../components/QuickMessage";

function AdminDashboardContent() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/admin/");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
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

  const handleSearch = async (query) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const [studentsRes, alertsRes, casesRes] = await Promise.all([
        api.get(`/students/?search=${query}`),
        api.get(`/alerts/?search=${query}`),
        api.get(`/cases/?search=${query}`)
      ]);
      const results = [
        ...(studentsRes.data.results || []).map(s => ({ ...s, type: 'student' })),
        ...(alertsRes.data.results || []).map(a => ({ ...a, type: 'alert' })),
        ...(casesRes.data.results || []).map(c => ({ ...c, type: 'case' }))
      ];
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

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
    showToast.success(`Exported ${data.length} records`);
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Listen for tab change events from navbar
    const handleTabChange = (event) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('adminTabChange', handleTabChange);
    return () => window.removeEventListener('adminTabChange', handleTabChange);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="animate-pulse space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard</p>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
        <Navbar 
          user={user} 
          dashboardData={dashboardData} 
          searchQuery={searchTerm}
          onSearchChange={handleSearch}
          searchResults={searchResults}
          showSearchResults={showSearchResults}
          onCloseSearch={() => setShowSearchResults(false)}
        />

        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {activeTab === "overview" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    System Control Center
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Enterprise oversight and risk intelligence
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={loadDashboard}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
                  >
                    Refresh Data
                  </button>
                  <button
                    onClick={() => handleExportCSV(dashboardData.escalated_cases || [], 'escalated_cases')}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <ExecutiveKPIs data={dashboardData} />
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

          {activeTab === "governance" && <GovernanceView />}

          {activeTab === "timetable" && <TimetableManager />}

          {activeTab === "reports" && (
            <ReportsView />
          )}

          {(activeTab === "settings" || activeTab === "profile") && (
            <SettingsView initialTab={activeTab === "profile" ? "profile" : "profile"} />
          )}
        </div>
      </div>

      {showMessage && messageRecipient && (
        <QuickMessage
          recipientId={messageRecipient.id}
          recipientName={messageRecipient.name}
          recipientRole="Admin"
          onClose={() => setShowMessage(false)}
        />
      )}
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
