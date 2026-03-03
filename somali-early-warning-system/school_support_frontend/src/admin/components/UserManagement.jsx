import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Ban, CheckCircle, Shield, GraduationCap, BookOpen } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create or edit
  const [roleFilter, setRoleFilter] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
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
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      showToast.error(err.response?.data?.error || 'Failed to save user');
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show disabled users
        </label>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{user.classroom || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-300">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-300">
                      DISABLED
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.is_active ? (
                      <button
                        onClick={() => handleDisable(user.user_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Disable"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnable(user.user_id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all relative z-10">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Create User' : 'Edit User'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {modalMode === 'create' ? 'Add a new user to the system' : 'Update user information'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., john@school.com"
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="teacher">Teacher</option>
                  <option value="form_master">Form Master</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                >
                  ✓ {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
