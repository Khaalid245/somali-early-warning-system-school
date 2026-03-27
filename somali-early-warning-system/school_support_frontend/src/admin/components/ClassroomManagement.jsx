import { useState, useEffect } from 'react';
import { School, Plus, Edit, Users } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function ClassroomManagement() {
  const [classrooms, setClassrooms] = useState([]);
  const [formMasters, setFormMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    class_id: null,
    name: '',
    academic_year: new Date().getFullYear().toString(),
    form_master_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  const fetchData = async () => {
    try {
      const [classroomsRes, usersRes] = await Promise.all([
        api.get('/dashboard/admin/classrooms/'),
        api.get('/dashboard/admin/users/?role=form_master')
      ]);
      
      // Filter classrooms based on showInactive toggle
      const filteredClassrooms = showInactive 
        ? classroomsRes.data.classrooms 
        : classroomsRes.data.classrooms.filter(classroom => classroom.is_active);
      
      setClassrooms(filteredClassrooms);
      setFormMasters(usersRes.data.users.filter(u => u.is_active));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      class_id: null,
      name: '',
      academic_year: new Date().getFullYear().toString(),
      form_master_id: ''
    });
    setShowModal(true);
  };

  const handleEdit = (classroom) => {
    setModalMode('edit');
    setFormData({
      class_id: classroom.class_id,
      name: classroom.name,
      academic_year: classroom.academic_year,
      form_master_id: classroom.form_master_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await api.post('/dashboard/admin/classrooms/create/', {
          name: formData.name,
          academic_year: formData.academic_year,
          form_master_id: formData.form_master_id || null
        });
        showToast.success(`Classroom "${formData.name}" created successfully!`);
      } else {
        await api.patch(`/dashboard/admin/classrooms/${formData.class_id}/`, {
          name: formData.name,
          form_master_id: formData.form_master_id || null
        });
        showToast.success(`Classroom "${formData.name}" updated successfully!`);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save classroom:', err.response?.data);
      
      // Handle duplicate classroom error
      if (err.response?.data?.name) {
        showToast.error(`Classroom already exists: ${err.response.data.name[0]}`);
      } else if (err.response?.data?.form_master_id) {
        showToast.error(`Form master error: ${err.response.data.form_master_id[0]}`);
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to save classroom';
        showToast.error(errorMsg);
      }
    }
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
          <School className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Classroom Management</h2>
        </div>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Classroom
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Show inactive classrooms
        </label>
      </div>

      {/* Classrooms Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Academic Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Form Master</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Students</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((classroom) => (
              <tr key={classroom.class_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{classroom.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{classroom.academic_year}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">
                    {classroom.form_master || (
                      <span className="text-orange-600 font-medium">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{classroom.student_count}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {classroom.is_active ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded border border-green-200">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded border border-gray-200">
                      INACTIVE
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEdit(classroom)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <School className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No classrooms found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-lg max-w-md w-full mx-4 relative z-50" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div className="bg-green-600 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold text-white">Create Classroom</h3>
              <p className="text-green-50 text-sm mt-1">Add a new classroom to the system</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classroom Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  placeholder="e.g., Grade 10A"
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                    placeholder="e.g., 2026"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Master</label>
                <select
                  value={formData.form_master_id}
                  onChange={(e) => setFormData({ ...formData, form_master_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                >
                  <option value="">Unassigned</option>
                  {formMasters.map((fm) => (
                    <option key={fm.user_id} value={fm.user_id}>
                      {fm.name} {fm.classroom && `(Currently: ${fm.classroom})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Each form master can only be assigned to one classroom
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-[1.2] px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  {modalMode === 'create' ? 'Create Classroom' : 'Update Classroom'}
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
    </div>
  );
}
