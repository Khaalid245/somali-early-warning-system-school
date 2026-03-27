import { useState, useEffect } from 'react';
import { Settings, User, School, Shield, Database } from 'lucide-react';
import { showToast } from '../../utils/toast';
import api from '../../api/apiClient';
import TwoFactorSetup from '../../components/TwoFactorSetup';

// Reusable Components
const SettingsHeader = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
    <div className="flex items-center gap-3">
      <Settings className="w-8 h-8 text-green-600 flex-shrink-0" />
      <div>
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">System Settings</h1>
        <p className="text-gray-600 text-xs sm:text-sm">Manage your profile and system configuration</p>
      </div>
    </div>
  </div>
);

const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
        isActive ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  );
};

const SettingsTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="flex overflow-x-auto gap-1 p-2">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  </div>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, helperText }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {helperText && <span className="block text-xs text-gray-500 font-normal">{helperText}</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-colors"
    />
  </div>
);

const CheckboxField = ({ label, checked, onChange, helperText }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-600"
    />
    <div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  </label>
);

const SaveButton = ({ onClick, disabled, loading, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
  >
    {children}
  </button>
);

// Custom Hook for Settings Logic
const useSettingsData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    photo: null,
    photoPreview: null
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

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

  const [security, setSecurity] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    dataRetentionYears: 7,
    twoFactorAuth: false
  });

  const loadSettings = async () => {
    try {
      const profileRes = await api.get('/dashboard/settings/profile/');
      setCurrentUser(profileRes.data);
      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
        bio: profileRes.data.bio || '',
        photo: null,
        photoPreview: profileRes.data.profile_photo
      });

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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      formData.append('phone', profile.phone);
      formData.append('bio', profile.bio);
      if (profile.photo) {
        formData.append('profile_photo', profile.photo);
      }

      const response = await api.put('/dashboard/settings/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast.success('Profile updated successfully');
      setProfile({
        name: response.data.name || profile.name,
        email: response.data.email || profile.email,
        phone: response.data.phone || profile.phone,
        bio: response.data.bio || profile.bio,
        photo: null,
        photoPreview: response.data.profile_photo
      });
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

  return {
    loading,
    saving,
    currentUser,
    profile,
    setProfile,
    passwords,
    setPasswords,
    school,
    setSchool,
    systemConfig,
    setSystemConfig,
    security,
    setSecurity,
    loadSettings,
    handleSaveProfile,
    handleChangePassword,
    handleSaveSchool,
    handleSaveSystem,
    handleSaveSecurity
  };
};

export default function SettingsView({ initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [show2FA, setShow2FA] = useState(false);

  const {
    loading,
    saving,
    currentUser,
    profile,
    setProfile,
    passwords,
    setPasswords,
    school,
    setSchool,
    systemConfig,
    setSystemConfig,
    security,
    setSecurity,
    loadSettings,
    handleSaveProfile,
    handleChangePassword,
    handleSaveSchool,
    handleSaveSystem,
    handleSaveSecurity
  } = useSettingsData();

  useEffect(() => {
    loadSettings();
  }, []);

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'school', label: 'School Info', icon: School },
    { id: 'system', label: 'System Config', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsHeader />
      <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Profile Tab - Will be implemented with reusable components */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-green-600" />
            My Profile
          </h2>
          <p className="text-gray-600">Profile settings content here...</p>
        </div>
      )}

      {/* Other tabs will be implemented similarly */}
      {activeTab === 'school' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <School className="w-6 h-6 text-green-600" />
            School Information
          </h2>
          <p className="text-gray-600">School settings content here...</p>
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
