import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [assignmentsRes, dashboardRes] = await Promise.all([
        api.get("/academics/assignments/"),
        api.get("/dashboard/")
      ]);

      const myAssignments = assignmentsRes.data.filter(a => a.teacher === user.user_id);
      
      setProfileData({
        assignments: myAssignments,
        stats: dashboardRes.data
      });
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-sm sm:text-base text-gray-600">View your account information and teaching statistics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {user?.name?.charAt(0) || "T"}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.name || "Teacher"}</h2>
                  <p className="text-sm text-gray-500 mb-4">Teacher</p>
                  
                  <div className="w-full space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">📧 Email:</span>
                      <span className="text-gray-800 font-medium">{user?.email || "teacher@school.com"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">👤 User ID:</span>
                      <span className="text-gray-800 font-medium">{user?.user_id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">🎓 Role:</span>
                      <span className="text-gray-800 font-medium">Teacher</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/teacher/settings")}
                    className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Teaching Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Teaching Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{profileData?.assignments?.length || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Classes</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{profileData?.stats?.today_absent_count || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Today's Absences</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-600">{profileData?.stats?.active_alerts || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Active Alerts</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{profileData?.stats?.high_risk_students?.length || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">At-Risk Students</p>
                  </div>
                </div>
              </div>

              {/* My Classes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">My Teaching Assignments</h3>
                {profileData?.assignments?.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.assignments.map((assignment) => (
                      <div key={assignment.assignment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                        <div>
                          <p className="font-semibold text-gray-800">{assignment.classroom_name}</p>
                          <p className="text-sm text-gray-600">{assignment.subject_name}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No teaching assignments yet</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/teacher/attendance")}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <span className="text-2xl mb-2 block">✓</span>
                    <p className="font-semibold text-gray-800">Take Attendance</p>
                    <p className="text-sm text-gray-600">Record student attendance</p>
                  </button>
                  <button
                    onClick={() => navigate("/teacher")}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <span className="text-2xl mb-2 block">📊</span>
                    <p className="font-semibold text-gray-800">View Dashboard</p>
                    <p className="text-sm text-gray-600">Check alerts and stats</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
