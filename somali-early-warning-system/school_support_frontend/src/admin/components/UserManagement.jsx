import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Ban, CheckCircle, Shield, GraduationCap, BookOpen, Key } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create or edit
  const [roleFilter, setRoleFilter] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [passwordError, setPasswordError] = useState(''); // Add password error state
  const [emailError, setEmailError] = useState(''); // Add email error state
  const [formData, setFormData] = useState({
    user_id: null,
    name: '',
    email: '',
    password: '',
    role: 'teacher'
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, showDisabled]);

  const fetchUsers = async () => {
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const response = await api.get(`/dashboard/admin/users/${params}`);
      // Filter users based on showDisabled toggle
      const filteredUsers = showDisabled 
        ? response.data.users 
        : response.data.users.filter(user => user.is_active);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ user_id: null, name: '', email: '', password: '', role: 'teacher' });
    setPasswordError(''); // Clear errors
    setEmailError('');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setFormData({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setPasswordError(''); // Clear errors
    setEmailError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordError('');
    setEmailError('');
    
    try {
      if (modalMode === 'create') {
        await api.post('/dashboard/admin/users/create/', formData);
        showToast.success('User created successfully');
      } else {
        await api.patch(`/dashboard/admin/users/${formData.user_id}/`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        showToast.success('User updated successfully');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      console.log('Error response:', err.response?.data); // Debug log
      
      // Handle different error response formats
      let errorMessage = 'Failed to save user';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // Check if it's a password validation error
        if (errorMessage.toLowerCase().includes('password')) {
          setPasswordError(errorMessage);
          return; // Don't show toast, show inline error instead
        }
        
        // Check if it's an email validation error
        if (errorMessage.toLowerCase().includes('email') || errorMessage.includes('Duplicate entry')) {
          setEmailError('This email address is already in use');
          return; // Don't show toast, show inline error instead
        }
      }
      
      // For other errors, still show toast
      showToast.error(errorMessage);
    }
  };

  const handleDisable = async (userId) => {
    if (!confirm('Are you sure you want to disable this user?')) return;
    
    try {
      await api.post(`/dashboard/admin/users/${userId}/disable/`);
      showToast.success('User disabled successfully');
      fetchUsers();
    } catch (err) {
      console.error('Failed to disable user:', err);
      showToast.error(err.response?.data?.error || 'Failed to disable user');
    }
  };

  const handleEnable = async (userId) => {
    try {
      await api.post(`/dashboard/admin/users/${userId}/enable/`);
      showToast.success('User enabled successfully');
      fetchUsers();
    } catch (err) {
      console.error('Failed to enable user:', err);
      showToast.error('Failed to enable user');
    }
  };

  const handleResetPassword = async (user) => {
    if (!confirm(`Reset password for ${user.name}?\n\nA temporary password will be sent to: ${user.email}`)) return;
    
    try {
      const response = await api.post(`/dashboard/admin/users/${user.user_id}/reset-password/`);
      setNewPassword(response.data.new_password);
      setResetUserName(user.name);
      setShowPasswordModal(true);
      
      if (response.data.email_sent) {
        showToast.success(`Password reset! Email sent to ${user.email}`);
      } else {
        showToast.warning('Password reset, but email failed to send. Please share manually.');
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      showToast.error(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    showToast.success('Password copied to clipboard!');
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield className="w-4 h-4" />;
    if (role === 'form_master') return <GraduationCap className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      form_master: 'bg-blue-100 text-blue-800 border-blue-300',
      teacher: 'bg-green-100 text-green-800 border-green-300'
    };
    return badges[role] || badges.teacher;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        </div>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="form_master">Form Master</option>
          <option value="teacher">Teacher</option>
        </select>
        
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showDisabled}
            onChange={(e) => setShowDisabled(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Show disabled users
        </label>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{user.classroom || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded border border-green-200">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded border border-red-200">
                      DISABLED
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {user.is_active ? (
                      <button
                        onClick={() => handleDisable(user.user_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Disable"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnable(user.user_id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Enable"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No users found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 relative z-10" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div className="bg-green-600 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold text-white">
                {modalMode === 'create' ? 'Create User' : 'Edit User'}
              </h3>
              <p className="text-green-50 text-sm mt-1">
                {modalMode === 'create' ? 'Add a new user to the system' : 'Update user information'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {/* Two-column grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                      style={{ boxShadow: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setEmailError(''); // Clear error when user types
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none ${
                        emailError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
                      }`}
                      style={{ boxShadow: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = emailError ? '0 0 0 2px #FEE2E2' : '0 0 0 2px #DCFCE7'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                      placeholder="e.g., john@school.com"
                      required
                    />
                    {emailError && (
                      <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                        <span className="text-red-500">⚠️</span>
                        <span>{emailError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                      style={{ boxShadow: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                      required
                    >
                      <option value="teacher">Teacher</option>
                      <option value="form_master">Form Master</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {modalMode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setPasswordError(''); // Clear error when user types
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none ${
                          passwordError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
                        }`}
                        style={{ boxShadow: 'none' }}
                        onFocus={(e) => e.target.style.boxShadow = passwordError ? '0 0 0 2px #FEE2E2' : '0 0 0 2px #DCFCE7'}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                        placeholder="Enter password"
                        required
                      />
                      {!passwordError && (
                        <div className="mt-1 text-xs text-gray-500">
                          8+ chars, uppercase, lowercase, digit, special char
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password error - full width below grid */}
              {passwordError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2 text-red-700 text-sm">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <div>
                      <div className="font-medium mb-1">Password requirements not met:</div>
                      <div className="text-xs leading-relaxed">{passwordError}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-[1.2] px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0" onClick={() => setShowPasswordModal(false)}></div>
          <div className="bg-white rounded-lg max-w-md w-full mx-4 relative z-10" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Password Reset Successful</h3>
              <p className="text-orange-100 text-sm mt-1">New temporary password for {resetUserName}</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Email Sent Successfully!</span>
                </div>
                <p className="text-sm text-green-700">
                  The temporary password has been automatically sent to the user's email address.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Temporary Password (Backup)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border-2 border-orange-300 rounded-lg font-mono text-lg font-bold text-orange-900"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> The user will receive an email with login instructions and their temporary password. They should change it after logging in.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
