import { useState } from 'react';
import { showToast } from '../../../utils/toast';
import api from '../../../api/apiClient';

export const useSettingsData = () => {
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
