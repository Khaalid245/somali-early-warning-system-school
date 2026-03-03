import { useState, useEffect } from 'react';
import { Settings, User, School, Shield, Bell, Database, Save, Upload, Camera } from 'lucide-react';
import { showToast } from '../../utils/toast';
import api from '../../api/apiClient';
import TwoFactorSetup from '../../components/TwoFactorSetup';

export default function SettingsView({ initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show2FA, setShow2FA] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Profile Settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    photo: null,
    photoPreview: null
  });

  // Password Change
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // School Settings
  const [school, setSchool] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    academicYear: '',
    logo: null,
    logoPreview: null
  });

  // System Configuration
  const [systemConfig, setSystemConfig] = useState({
    absenceThreshold: 3,
    autoEscalationDays: 15,
    emailNotifications: true,
    smsNotifications: false,
    riskLowMin: 0,
    riskMediumMin: 30,
    riskHighMin: 60,
    riskCriticalMin: 80
  });

  // Security Settings
  const [security, setSecurity] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    dataRetentionYears: 7,
    twoFactorAuth: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load profile
      const profileRes = await api.get('/dashboard/settings/profile/');
      console.log('Profile API Response:', profileRes.data);
      setCurrentUser(profileRes.data);
      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        bio: profileRes.data.bio || '',
        photo: null,
        photoPreview: profileRes.data.profile_photo
      });
      console.log('Profile photo URL:', profileRes.data.profile_photo);

      // Load school settings
      const schoolRes = await api.get('/dashboard/settings/school/');
      setSchool({
        name: schoolRes.data.school_name || '',
        code: schoolRes.data.school_code || '',
        address: schoolRes.data.school_address || '',
        phone: schoolRes.data.school_phone || '',
        email: schoolRes.data.school_email || '',
        academicYear: schoolRes.data.academic_year || '',
        logo: null,
        logoPreview: schoolRes.data.school_logo
      });

      // Load system config
      const systemRes = await api.get('/dashboard/settings/system/');
      setSystemConfig({
        absenceThreshold: systemRes.data.absence_threshold,
        autoEscalationDays: systemRes.data.auto_escalation_days,
        emailNotifications: systemRes.data.email_notifications,
        smsNotifications: systemRes.data.sms_notifications,
        riskLowMin: systemRes.data.risk_low_min,
        riskMediumMin: systemRes.data.risk_medium_min,
        riskHighMin: systemRes.data.risk_high_min,
        riskCriticalMin: systemRes.data.risk_critical_min
      });

      // Load security settings
      const securityRes = await api.get('/dashboard/settings/security/');
      setSecurity({
        sessionTimeout: securityRes.data.session_timeout,
        passwordMinLength: securityRes.data.password_min_length,
        requireUppercase: securityRes.data.require_uppercase,
        requireNumbers: securityRes.data.require_numbers,
        dataRetentionYears: securityRes.data.data_retention_years,
        twoFactorAuth: securityRes.data.two_factor_auth
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log('Preview URL created:', previewUrl);
      setProfile({
        ...profile,
        photo: file,
        photoPreview: previewUrl
      });
      console.log('Profile state updated with photo');
    }
  };

  const handleSchoolLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSchool({
        ...school,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      formData.append('phone', profile.phone);
      formData.append('bio', profile.bio);
      if (profile.photo) {
        console.log('Appending photo to FormData:', profile.photo);
        formData.append('profile_photo', profile.photo);
      } else {
        console.log('No photo selected');
      }

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }

      const response = await api.put('/dashboard/settings/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Save Profile Response:', response.data);
      showToast.success('Profile updated successfully');
      
      // Update all profile fields with response data
      setProfile({
        name: response.data.name || profile.name,
        email: response.data.email || profile.email,
        phone: response.data.phone || profile.phone,
        bio: response.data.bio || profile.bio,
        photo: null,
        photoPreview: response.data.profile_photo
      });
      console.log('Updated photoPreview:', response.data.profile_photo);
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      showToast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await api.post('/dashboard/settings/change-password/', {
        current_password: passwords.current,
        new_password: passwords.new
      });
      
      showToast.success('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchool = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('school_name', school.name);
      formData.append('school_code', school.code);
      formData.append('school_address', school.address);
      formData.append('school_phone', school.phone);
      formData.append('school_email', school.email);
      formData.append('academic_year', school.academicYear);
      if (school.logo) {
        formData.append('school_logo', school.logo);
      }

      await api.put('/dashboard/settings/school/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast.success('School settings saved successfully');
      loadSettings();
    } catch (err) {
      console.error('Failed to save school settings:', err);
      showToast.error('Failed to save school settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    setSaving(true);
    try {
      await api.put('/dashboard/settings/system/', {
        absence_threshold: systemConfig.absenceThreshold,
        auto_escalation_days: systemConfig.autoEscalationDays,
        email_notifications: systemConfig.emailNotifications,
        sms_notifications: systemConfig.smsNotifications,
        risk_low_min: systemConfig.riskLowMin,
        risk_medium_min: systemConfig.riskMediumMin,
        risk_high_min: systemConfig.riskHighMin,
        risk_critical_min: systemConfig.riskCriticalMin
      });
      
      showToast.success('System configuration saved successfully');
    } catch (err) {
      console.error('Failed to save system config:', err);
      showToast.error('Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      await api.put('/dashboard/settings/security/', {
        session_timeout: security.sessionTimeout,
        password_min_length: security.passwordMinLength,
        require_uppercase: security.requireUppercase,
        require_numbers: security.requireNumbers,
        data_retention_years: security.dataRetentionYears,
        two_factor_auth: security.twoFactorAuth
      });
      
      showToast.success('Security settings saved successfully');
    } catch (err) {
      console.error('Failed to save security settings:', err);
      showToast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, emoji: '👤' },
    { id: 'school', label: 'School Info', icon: School, emoji: '🏫' },
    { id: 'system', label: 'System Config', icon: Settings, emoji: '⚙️' },
    { id: 'security', label: 'Security', icon: Shield, emoji: '🔒' },
    { id: 'backup', label: 'Backup', icon: Database, emoji: '💾' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-white flex-shrink-0" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">System Settings</h1>
            <p className="text-indigo-100 text-xs sm:text-sm">Manage your profile and system configuration</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 sm:p-4">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            My Profile
          </h2>

          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {profile.photoPreview ? (
                  <img src={profile.photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{profile.email}</p>
                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium mx-auto sm:mx-0 cursor-pointer w-fit">
                  <Camera className="w-4 h-4" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role/Position</label>
                <input
                  type="text"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition font-medium"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>

            {/* 2FA Setup */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account with 2FA
              </p>
              <button
                onClick={() => setShow2FA(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                {currentUser?.two_factor_enabled ? '✓ 2FA Enabled - Manage' : 'Setup 2FA'}
              </button>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* School Information */}
      {activeTab === 'school' && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            School Information
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
                <input
                  type="text"
                  value={school.code}
                  onChange={(e) => setSchool({ ...school, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={school.address}
                  onChange={(e) => setSchool({ ...school, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={school.phone}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={school.email}
                  onChange={(e) => setSchool({ ...school, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <input
                  type="text"
                  value={school.academicYear}
                  onChange={(e) => setSchool({ ...school, academicYear: e.target.value })}
                  placeholder="2024-2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSchool}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save School Info'}
            </button>
          </div>
        </div>
      )}

      {/* System Configuration */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* Alert Thresholds */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              Alert Thresholds
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absence Alert Threshold
                  <span className="block text-xs text-gray-500 font-normal">Create alert after this many absences</span>
                </label>
                <input
                  type="number"
                  value={systemConfig.absenceThreshold}
                  onChange={(e) => setSystemConfig({ ...systemConfig, absenceThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Escalation Days
                  <span className="block text-xs text-gray-500 font-normal">Escalate case after this many days</span>
                </label>
                <input
                  type="number"
                  value={systemConfig.autoEscalationDays}
                  onChange={(e) => setSystemConfig({ ...systemConfig, autoEscalationDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Risk Levels */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Risk Level Definitions
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 w-24">Low Risk</span>
                <input
                  type="number"
                  value={systemConfig.riskLowMin}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled
                />
                <span className="text-sm text-gray-600">to 29</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 w-24">Medium Risk</span>
                <input
                  type="number"
                  value={systemConfig.riskMediumMin}
                  onChange={(e) => setSystemConfig({ ...systemConfig, riskMediumMin: parseInt(e.target.value) })}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">to 59</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 w-24">High Risk</span>
                <input
                  type="number"
                  value={systemConfig.riskHighMin}
                  onChange={(e) => setSystemConfig({ ...systemConfig, riskHighMin: parseInt(e.target.value) })}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">to 79</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 w-24">Critical</span>
                <input
                  type="number"
                  value={systemConfig.riskCriticalMin}
                  onChange={(e) => setSystemConfig({ ...systemConfig, riskCriticalMin: parseInt(e.target.value) })}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">to 100</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Notification Settings
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.emailNotifications}
                  onChange={(e) => setSystemConfig({ ...systemConfig, emailNotifications: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                  <p className="text-xs text-gray-500">Send email alerts to teachers and form masters</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.smsNotifications}
                  onChange={(e) => setSystemConfig({ ...systemConfig, smsNotifications: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">SMS Notifications</span>
                  <p className="text-xs text-gray-500">Send text messages for urgent alerts (requires SMS gateway)</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveSystem}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Security Settings
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                  <span className="block text-xs text-gray-500 font-normal">Auto-logout after inactivity</span>
                </label>
                <input
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Min Length
                  <span className="block text-xs text-gray-500 font-normal">Minimum characters required</span>
                </label>
                <input
                  type="number"
                  value={security.passwordMinLength}
                  onChange={(e) => setSecurity({ ...security, passwordMinLength: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (years)
                  <span className="block text-xs text-gray-500 font-normal">FERPA requires 7 years</span>
                </label>
                <input
                  type="number"
                  value={security.dataRetentionYears}
                  onChange={(e) => setSecurity({ ...security, dataRetentionYears: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Password Requirements</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.requireUppercase}
                  onChange={(e) => setSecurity({ ...security, requireUppercase: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">Require uppercase letters</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.requireNumbers}
                  onChange={(e) => setSecurity({ ...security, requireNumbers: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">Require numbers</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.twoFactorAuth}
                  onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm text-gray-900">Two-Factor Authentication</span>
                  <p className="text-xs text-gray-500">Require SMS code on login (coming soon)</p>
                </div>
              </label>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span><strong>FERPA Compliance:</strong> These security settings help meet legal requirements for protecting student data. Keep data retention at 7 years minimum.</span>
              </p>
            </div>

            <button
              onClick={handleSaveSecurity}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Backup & Export */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">💾</span>
            Backup & Data Export
          </h2>

          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Why Backup?</h3>
              <p className="text-sm text-blue-800">Regular backups protect your data from loss. Export all data for migration or compliance audits.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Database Backup</h3>
                <p className="text-sm text-gray-600 mb-4">Download complete database backup</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2">
                  <Database className="w-5 h-5" />
                  Download Backup
                </button>
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Export All Data</h3>
                <p className="text-sm text-gray-600 mb-4">Export all records as CSV files</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Export Data
                </button>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <span>⚠️</span>
                Restore from Backup
              </h3>
              <p className="text-sm text-red-800 mb-3">This will replace all current data. Use with caution!</p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm">
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {show2FA && (
        <TwoFactorSetup
          user={currentUser}
          onClose={(updated) => {
            setShow2FA(false);
            if (updated) {
              loadSettings();
            }
          }}
        />
      )}
    </div>
  );
}
