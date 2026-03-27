import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Search, GraduationCap } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState({
    admission_number: '',
    full_name: '',
    gender: 'male',
    parent_name: '',
    parent_email: '',
    parent_phone: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students/');
      console.log('Students response:', response.data);
      
      // Handle different response formats
      let studentsList = [];
      if (Array.isArray(response.data)) {
        studentsList = response.data;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        studentsList = response.data.students;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        studentsList = response.data.results;
      }
      
      setStudents(studentsList);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      showToast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.patch(`/students/${editingStudentId}/`, formData);
        showToast.success(`Student "${formData.full_name}" updated successfully!`);
      } else {
        await api.post('/students/', formData);
        showToast.success(`Student "${formData.full_name}" created successfully!`);
      }
      setShowModal(false);
      setEditMode(false);
      setEditingStudentId(null);
      setFormData({ admission_number: '', full_name: '', gender: 'male', parent_name: '', parent_email: '', parent_phone: '' });
      fetchStudents();
    } catch (err) {
      console.error('Student operation error:', err.response?.data);
      
      if (err.response?.data?.admission_number) {
        showToast.error(`Admission number already exists: ${err.response.data.admission_number[0]}`);
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || `Failed to ${editMode ? 'update' : 'create'} student`;
        showToast.error(errorMsg);
      }
    }
  };

  const handleEdit = (student) => {
    setEditMode(true);
    setEditingStudentId(student.student_id);
    setFormData({
      admission_number: student.admission_number,
      full_name: student.full_name,
      gender: student.gender,
      parent_name: student.parent_name || '',
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditingStudentId(null);
    setFormData({ admission_number: '', full_name: '', gender: 'male', parent_name: '', parent_email: '', parent_phone: '' });
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
            <p className="text-sm text-gray-600">{students.length} students registered</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Admission No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Full Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Gender</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Parent Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }}>
                <td className="px-4 py-4 font-mono text-sm font-medium text-gray-900">{student.admission_number}</td>
                <td className="px-4 py-4 font-medium text-gray-900">{student.full_name}</td>
                <td className="px-4 py-4 text-gray-700 capitalize">{student.gender}</td>
                <td className="px-4 py-4 text-gray-700">
                  {student.parent_phone || student.parent_email ? (
                    <div className="text-sm">
                      {student.parent_name && <div className="font-medium text-gray-900">{student.parent_name}</div>}
                      {student.parent_phone && <div className="text-gray-600">{student.parent_phone}</div>}
                      {student.parent_email && <div className="text-xs text-gray-500">{student.parent_email}</div>}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No contact</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-50 rounded-full border border-green-200">
                    {student.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Edit student"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm">Add your first student to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 transform transition-all relative z-10 max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div className="bg-green-50 border-b-2 border-green-200 px-6 py-4 rounded-t-lg" style={{ backgroundColor: '#F0FDF4' }}>
              <h3 className="text-xl font-semibold text-green-900">{editMode ? 'Edit Student' : 'Add Student'}</h3>
              <p className="text-green-700 text-sm mt-1">{editMode ? 'Update student information' : 'Register a new student in the system'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admission Number</label>
                  <input
                    type="text"
                    value={formData.admission_number}
                    onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="e.g., ADM001"
                    disabled={editMode}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Parent/Guardian Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Parent/Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Email</label>
                    <input
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., parent@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Phone</label>
                    <input
                      type="tel"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., +252 61 234 5678"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition">
                  {editMode ? 'Update Student' : 'Create Student'}
                </button>
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
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
