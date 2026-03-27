import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { showToast } from "../utils/toast";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TwoFactorSetup from "../components/TwoFactorSetup";
import { Settings as SettingsIcon, Camera, User, Mail, Phone, FileText, Lock, Bell, Info, Shield, Zap, LogOut, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    biography: user?.biography || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [passwordError, setPasswordError] = useState(''); // Add password validation error
  const [currentPasswordError, setCurrentPasswordError] = useState(''); // Add current password error

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await api.get('/dashboard/settings/profile/');
      console.log('Profile loaded:', res.data);
      console.log('Profile photo URL:', res.data.profile_photo);
      
      setFormData({
        ...formData,
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        biography: res.data.bio || ''
      });
      
      if (res.data.profile_photo) {
        console.log('Setting image preview to:', res.data.profile_photo);
        setImagePreview(res.data.profile_photo);
      } else {
        console.log('No profile photo in response');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      
      if (profileImage) {
        // Use FormData when uploading image
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        if (formData.phone) formDataToSend.append('phone', formData.phone);
        if (formData.biography) formDataToSend.append('bio', formData.biography);
        formDataToSend.append('profile_photo', profileImage);
        
        console.log('Sending FormData with file:', profileImage.name, profileImage.size);
        console.log('FormData entries:');
        for (let pair of formDataToSend.entries()) {
          console.log(pair[0], pair[1]);
        }
        
        // Use fetch directly for file upload to avoid API client issues
        const token = sessionStorage.getItem('access');
        const fetchResponse = await fetch('http://127.0.0.1:8000/api/dashboard/settings/profile/', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        response = { data: await fetchResponse.json() };
      } else {
        // Use JSON for text-only updates
        const jsonData = {
          name: formData.name,
          phone: formData.phone || '',
          bio: formData.biography || ''
        };
        
        response = await api.put('/dashboard/settings/profile/', jsonData);
      }
      
      // Update user context with new data
      updateUser({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        biography: response.data.bio,
        profile_image: response.data.profile_photo
      });
      
      console.log('Profile updated, photo URL:', response.data.profile_photo);
      
      // Update image preview
      if (response.data.profile_photo) {
        console.log('Setting new image preview:', response.data.profile_photo);
        setImagePreview(response.data.profile_photo);
      }
      
      // Reset profile image state after successful upload
      setProfileImage(null);
      
      showToast.success('Profile updated successfully!');
      
      // Reload profile to ensure we have latest data
      await loadUserProfile();
    } catch (err) {
      console.error('Update error:', err.response?.data);
      const errorMsg = err.response?.data?.error 
        || Object.values(err.response?.data || {}).flat().join(', ')
        || 'Failed to update profile';
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordError('');
    setCurrentPasswordError('');
    
    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }

    // Basic length check (detailed validation will be done on backend)
    if (formData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/change-password/", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });
      showToast.success('Password changed successfully!');
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error('Password change error:', err.response?.data);
      
      // Handle different types of errors
      if (err.response?.data?.error) {
        const errorMessage = err.response.data.error;
        
        // Check if it's a password validation error
        if (errorMessage.toLowerCase().includes('password') && 
            (errorMessage.includes('characters') || errorMessage.includes('uppercase') || 
             errorMessage.includes('lowercase') || errorMessage.includes('digit') || 
             errorMessage.includes('special'))) {
          setPasswordError(errorMessage);
        } else if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('incorrect')) {
          setCurrentPasswordError('Current password is incorrect');
        } else {
          showToast.error(errorMessage);
        }
      } else {
        showToast.error(err.response?.data?.detail || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-green-600" />
              Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Image */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-600" />
                Profile Picture
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden" style={{ border: '3px solid #DCFCE7', backgroundColor: '#F3F4F6' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ color: '#16A34A', backgroundColor: '#F0FDF4' }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-colors"
                    style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Click camera icon to upload</p>
                  <p className="text-xs text-gray-500">Max size: 5MB</p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Profile Information
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed text-sm"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+252 XX XXX XXXX"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biography</label>
                  <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.biography?.length || 0}/500 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 transition-colors disabled:opacity-50 font-medium text-sm"
                  style={{ backgroundColor: '#16A34A', color: '#FFFFFF', borderRadius: '8px' }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#15803D')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#16A34A')}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, currentPassword: e.target.value });
                      setCurrentPasswordError(''); // Clear error when user types
                    }}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition text-sm ${
                      currentPasswordError ? 'border-red-300 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    style={{ backgroundColor: '#FFFFFF', borderColor: currentPasswordError ? '#FCA5A5' : '#E5E7EB' }}
                    required
                  />
                  {currentPasswordError && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                      <span className="text-red-500">⚠️</span>
                      <span>{currentPasswordError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      setPasswordError(''); // Clear error when user types
                    }}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition text-sm ${
                      passwordError ? 'border-red-300 focus:ring-red-500' : 'focus:ring-green-500'
                    }`}
                    style={{ backgroundColor: '#FFFFFF', borderColor: passwordError ? '#FCA5A5' : '#E5E7EB' }}
                    required
                  />
                  {passwordError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2 text-red-700 text-sm">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <div>
                          <div className="font-medium mb-1">Password requirements not met:</div>
                          <div className="text-xs leading-relaxed">{passwordError}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!passwordError && (
                    <div className="mt-2 text-xs text-gray-500">
                      Password must contain at least 8 characters, including uppercase, lowercase, digit, and special character.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                    required
                  />
                  {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                      <span className="text-red-500">⚠️</span>
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 transition-colors disabled:opacity-50 font-medium text-sm"
                  style={{ backgroundColor: 'transparent', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Dashboard Notifications</p>
                    <p className="text-sm text-gray-600">Show alerts on dashboard</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-semibold text-gray-800 capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className="text-sm font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Security
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShow2FA(true)}
                  className="w-full px-4 py-3 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                  style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {user?.two_factor_enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      2FA Enabled
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Setup 2FA
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/teacher")}
                  className="w-full px-4 py-3 transition-colors font-medium text-sm"
                  style={{ borderColor: '#E5E7EB', color: '#374151', backgroundColor: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {show2FA && (
        <TwoFactorSetup
          user={user}
          onClose={(updated) => {
            setShow2FA(false);
            if (updated) {
              loadUserProfile();
            }
          }}
        />
      )}
    </div>
  );
}
