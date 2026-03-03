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

export default function FormMasterDashboardNew() {
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
      showToast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
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
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={dashboardData} />

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <span className="text-4xl">👔</span>
              My Classroom Dashboard
            </h1>
            <p className="text-gray-600">Monitor your students and manage interventions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon="🔔"
              title="Alerts to Review"
              value={dashboardData.assigned_alerts || 0}
              subtitle="Students need attention"
              gradient="from-orange-500 to-orange-600"
            />
            <StatCard
              icon="📋"
              title="Open Cases"
              value={dashboardData.open_cases || 0}
              subtitle="Active interventions"
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard
              icon="⚠️"
              title="High Risk Students"
              value={dashboardData.high_risk_count || 0}
              subtitle="Need urgent help"
              gradient="from-red-500 to-red-600"
            />
            <StatCard
              icon="🚨"
              title="Escalated Cases"
              value={dashboardData.escalated_cases || 0}
              subtitle="Sent to admin"
              gradient="from-purple-500 to-purple-600"
            />
          </div>

          {/* High Risk Students */}
          <InfoCard
            icon="⚠️"
            title="Students Who Need Help Now"
            subtitle="These students are missing too many classes"
            headerGradient="from-red-600 to-red-700"
          >
            {dashboardData.high_risk_students?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Student</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Class</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Attendance</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Missed</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.high_risk_students.map((student) => (
                      <tr key={student.student__student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800">{student.student__full_name}</p>
                          <p className="text-xs text-gray-500">ID: {student.student__student_id}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{student.classroom}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-lg font-bold ${
                            student.attendance_rate >= 80 ? 'text-green-600' :
                            student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-bold text-red-600">{student.absent_count}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                            📝 Create Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">✅</span>
                <p className="text-gray-500 text-lg">Great! No high-risk students</p>
              </div>
            )}
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
