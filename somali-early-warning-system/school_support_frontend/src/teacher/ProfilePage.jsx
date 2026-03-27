import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { User, Mail, IdCard, GraduationCap, BookOpen, AlertTriangle, Users, CheckCircle, LayoutDashboard, Settings } from 'lucide-react';

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
      const userId = user?.user_id || user?.id;
      console.log('[Profile] Loading profile for user:', userId);
      
      const [assignmentsRes, dashboardRes] = await Promise.all([
        api.get("/academics/assignments/"),
        api.get("/dashboard/")
      ]);

      console.log('[Profile] Assignments response:', assignmentsRes.data);
      console.log('[Profile] Dashboard response:', dashboardRes.data);

      // Handle both array and paginated response formats
      const allAssignments = assignmentsRes.data.results || assignmentsRes.data || [];
      console.log('[Profile] All assignments:', allAssignments);
      
      // Filter assignments for current teacher
      const myAssignments = Array.isArray(allAssignments) 
        ? allAssignments.filter(a => a.teacher === userId || a.teacher_id === userId)
        : [];
      
      console.log('[Profile] My assignments:', myAssignments);
      
      setProfileData({
        assignments: myAssignments,
        stats: dashboardRes.data
      });
    } catch (err) {
      console.error("Failed to load profile", err);
      setProfileData({ assignments: [], stats: {} });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#16A34A' }}></div>
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
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
              <User className="w-7 h-7 text-green-600" />
              My Profile
            </h1>
            <p className="text-sm text-gray-600 mt-1">View your account information and teaching statistics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4" style={{ backgroundColor: '#16A34A', border: '3px solid #DCFCE7' }}>
                    {user?.name?.charAt(0) || "T"}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{user?.name || "Teacher"}</h2>
                  <p className="text-sm text-gray-600 mb-4">Teacher</p>
                  
                  <div className="w-full space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-800 font-medium truncate">{user?.email || "teacher@school.com"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <IdCard className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">User ID:</span>
                      <span className="text-gray-800 font-medium">#{user?.user_id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Role:</span>
                      <span className="text-gray-800 font-medium">Teacher</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/teacher/settings")}
                    className="w-full mt-6 px-4 py-2.5 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    style={{ backgroundColor: '#16A34A', color: '#FFFFFF', borderRadius: '8px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Teaching Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Teaching Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-800">{profileData?.assignments?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Classes</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-800">{profileData?.stats?.today_absent_count || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Today's Absences</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-800">{profileData?.stats?.active_alerts || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Active Alerts</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-800">{profileData?.stats?.high_risk_students?.length || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">At-Risk Students</p>
                  </div>
                </div>
              </div>

              {/* My Classes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">My Teaching Assignments</h3>
                {profileData?.assignments?.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.assignments.map((assignment) => (
                      <div key={assignment.assignment_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#BBF7D0'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{assignment.classroom__name || assignment.classroom_name || 'Classroom'}</p>
                            <p className="text-sm text-gray-600">{assignment.subject__name || assignment.subject_name || 'Subject'}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: assignment.is_active ? '#F0FDF4' : '#F3F4F6', color: assignment.is_active ? '#16A34A' : '#6B7280', borderColor: assignment.is_active ? '#BBF7D0' : '#E5E7EB' }}>
                          {assignment.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No teaching assignments yet</p>
                    <p className="text-sm text-gray-400 mb-4">Assignments will appear here once assigned by your administrator</p>
                    <button
                      className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      style={{ backgroundColor: 'transparent', color: '#16A34A', border: '1px solid #16A34A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Contact Admin
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate("/teacher/attendance")}
                    className="p-4 border border-gray-200 rounded-lg transition-all text-left cursor-pointer"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#BBF7D0';
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">Take Attendance</p>
                    <p className="text-sm text-gray-600">Record student attendance</p>
                  </button>
                  <button
                    onClick={() => navigate("/teacher")}
                    className="p-4 border border-gray-200 rounded-lg transition-all text-left cursor-pointer"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#BBF7D0';
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-3">
                      <LayoutDashboard className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">View Dashboard</p>
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
