import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { showToast } from "../utils/toast";
import { Camera, Mail, User, Award, FileText, BarChart3, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);

  useEffect(() => {
    loadProfile();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = user.user_id || user.id;
      const response = await api.get(`/users/${userId}/`);
      setFullUserData(response.data);
      setImagePreview(response.data.profile_image);
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  };

  const loadProfile = async () => {
    try {
      const dashboardRes = await api.get("/interventions/dashboard/");
      setProfileData({
        stats: dashboardRes.data
      });
    } catch (err) {
      console.error("Failed to load profile", err);
      setProfileData({ stats: {} });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.size, file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append('profile_image', file, file.name);
      
      const userId = user.user_id || user.id;
      console.log('Uploading to:', `/users/${userId}/`);
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await api.patch(`/users/${userId}/`, formData, {
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      });

      console.log('Upload response:', response.data);

      // Update user context with new profile image
      const imageUrl = response.data.profile_image;
      updateUser({ ...user, profile_image: imageUrl });
      setImagePreview(imageUrl);
      showToast.success('Profile image updated successfully');
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast.error(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      const userId = user.user_id || user.id;
      const response = await api.patch(`/users/${userId}/`, {
        profile_image: null
      });

      updateUser({ ...user, profile_image: null });
      setImagePreview(null);
      showToast.success('Profile image removed successfully');
    } catch (err) {
      console.error('Failed to remove image:', err);
      showToast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const profileImageUrl = imagePreview || fullUserData?.profile_image || user?.profile_image;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">My Profile</h1>
            <p className="text-sm sm:text-base text-gray-600">View your account information and form master statistics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-4">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-green-100"
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-4xl font-semibold border-2 border-green-100"
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
                      >
                        {user?.name?.charAt(0) || "F"}
                      </div>
                    )}
                    
                    {/* Upload/Remove buttons */}
                    <div className="absolute -bottom-2 -right-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors">
                          {uploading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {profileImageUrl && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      className="text-xs text-red-600 hover:text-red-700 mb-2 disabled:opacity-50 transition-colors"
                    >
                      Remove Image
                    </button>
                  )}

                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{user?.name || "Form Master"}</h2>
                  <p className="text-sm text-gray-500 mb-4">Form Master</p>
                  
                  <div className="w-full space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 flex-shrink-0">Email:</span>
                      <span className="text-gray-800 font-medium truncate">{user?.email || "formmaster@school.com"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 flex-shrink-0">User ID:</span>
                      <span className="text-gray-800 font-medium">{user?.user_id || user?.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 flex-shrink-0">Role:</span>
                      <span className="text-gray-800 font-medium">Form Master</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/form-master/settings")}
                    className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form Master Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Master Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-semibold text-gray-800">{profileData?.stats?.statistics?.total_students || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Students</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-semibold text-gray-800">{profileData?.stats?.statistics?.high_risk_count || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">High Risk</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-3xl font-semibold text-gray-800">{profileData?.stats?.statistics?.active_cases || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Active Cases</p>
                  </div>
                  <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-semibold text-gray-800">{profileData?.stats?.statistics?.resolved_cases || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Resolved Cases</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                {profileData?.stats?.urgent_alerts?.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.stats.urgent_alerts.slice(0, 5).map((alert) => (
                      <div key={alert.alert_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-200 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-800">{alert.student_name}</p>
                          <p className="text-sm text-gray-600">{alert.alert_type}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          alert.risk_level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                          alert.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          alert.risk_level === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {alert.risk_level?.charAt(0).toUpperCase() + alert.risk_level?.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity available</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/form-master/interventions")}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-800">Manage Interventions</p>
                    <p className="text-sm text-gray-600">Create and track student interventions</p>
                  </button>
                  <button
                    onClick={() => navigate("/form-master")}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-800">View Dashboard</p>
                    <p className="text-sm text-gray-600">Check alerts and statistics</p>
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