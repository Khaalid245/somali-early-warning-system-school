import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import { showToast } from "../utils/toast";
import { cache, CACHE_KEYS } from "../utils/cache";
import { offlineSupport } from "../utils/offlineSupport";
import ProgressionTracking from "./components/ProgressionTracking";
import AttendanceOverview from "./components/AttendanceOverview";
import DailyAttendanceMonitor from "./components/DailyAttendanceMonitor";

export default function FormMasterDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const cachedData = cache.get(CACHE_KEYS.DASHBOARD_DATA);
      if (cachedData) {
        setDashboardData(cachedData);
        setLoading(false);
        return;
      }
      
      if (!navigator.onLine) {
        const offlineData = offlineSupport.getOfflineData();
        if (offlineData) {
          setDashboardData(offlineData);
          setLoading(false);
          showToast.info('Showing offline data');
          return;
        }
      }
      
      const res = await api.get("/dashboard/");
      setDashboardData(res.data);
      cache.set(CACHE_KEYS.DASHBOARD_DATA, res.data, 2 * 60 * 1000);
      offlineSupport.saveForOffline(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
      const offlineData = offlineSupport.getOfflineData();
      if (offlineData) {
        setDashboardData(offlineData);
        showToast.warning('Using offline data');
      } else {
        showToast.error("Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
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

  const getAlertStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      escalated: 'bg-red-100 text-red-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.active;
  };

  const getCaseStatusBadgeColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      awaiting_parent: 'bg-purple-100 text-purple-700',
      escalated_to_admin: 'bg-red-100 text-red-700',
      closed: 'bg-green-100 text-green-700'
    };
    return colors[status] || colors.open;
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const getTrendColor = (trend, inverse = false) => {
    if (inverse) {
      if (trend === "up") return "text-red-600";
      if (trend === "down") return "text-green-600";
    } else {
      if (trend === "up") return "text-green-600";
      if (trend === "down") return "text-red-600";
    }
    return "text-gray-600";
  };

  const handleAlertAction = async (alertId, newStatus) => {
    setActionLoading(true);
    try {
      if (!navigator.onLine) {
        offlineSupport.queueAction({ type: 'alert', alertId, newStatus });
        setDashboardData(prev => ({
          ...prev,
          urgent_alerts: prev.urgent_alerts?.map(alert => 
            alert.alert_id === alertId ? { ...alert, status: newStatus } : alert
          )
        }));
        showToast.info('Action queued - will sync when online');
        setActionLoading(false);
        return;
      }
      
      await api.patch(`/alerts/${alertId}/`, { status: newStatus });
      showToast.success(`Alert ${newStatus.replace('_', ' ')}`);
      cache.delete(CACHE_KEYS.DASHBOARD_DATA);
      loadDashboard();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to update alert');
    } finally {
      setActionLoading(false);
    }
  };

  const syncPendingActions = useCallback(async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    
    const pending = offlineSupport.getPendingActions();
    if (pending.length === 0) {
      setSyncInProgress(false);
      return;
    }
    
    const failed = [];
    for (const action of pending) {
      try {
        if (action.type === 'alert') {
          await api.patch(`/alerts/${action.alertId}/`, { status: action.newStatus });
        }
      } catch (err) {
        console.error('Failed to sync action:', err);
        failed.push(action);
      }
    }
    
    if (failed.length > 0) {
      offlineSupport.clearPendingActions();
      failed.forEach(action => offlineSupport.queueAction(action));
      showToast.warning(`${pending.length - failed.length} synced, ${failed.length} failed - will retry`);
    } else {
      offlineSupport.clearPendingActions();
      showToast.success('All changes synced');
    }
    
    setSyncInProgress(false);
    cache.delete(CACHE_KEYS.DASHBOARD_DATA);
    loadDashboard();
  }, [syncInProgress, loadDashboard]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    loadDashboard();
    
    const handleOnline = () => {
      setIsOffline(false);
      showToast.success('Back online - syncing data...');
      syncPendingActions();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast.warning('You are offline - changes will sync when online');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(() => {
      if (navigator.onLine) {
        cache.delete(CACHE_KEYS.DASHBOARD_DATA);
        loadDashboard();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadDashboard, syncPendingActions]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabClick} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-8">
          {activeTab === "overview" && (
            <>Overview content here</>
          )}

          {activeTab === "alerts" && (
            <>Alerts content here</>
          )}

          {activeTab === "cases" && (
            <>Cases content here</>
          )}

          {activeTab === "students" && (
            <>Students content here</>
          )}

          {activeTab === "progression" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Student Progression Tracking</h1>
                <p className="text-gray-600">Monitor intervention effectiveness and student improvement</p>
              </div>
              <ProgressionTracking 
                cases={dashboardData.pending_cases || []} 
                getRiskBadgeColor={getRiskBadgeColor}
                onUpdateProgress={() => showToast.info('Update feature coming soon')}
                onEscalate={() => showToast.info('Escalation feature coming soon')}
                isLoading={() => false}
              />
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
                <p className="text-gray-600">View all students attendance records and history</p>
              </div>
              <AttendanceOverview />
            </div>
          )}

          {activeTab === "daily-monitor" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Daily Attendance Monitor</h1>
                <p className="text-gray-600">Real-time attendance monitoring for today</p>
              </div>
              <DailyAttendanceMonitor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
