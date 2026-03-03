import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    admission_number: '',
    full_name: '',
    gender: 'male'
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
      await api.post('/students/', formData);
      showToast.success(`Student "${formData.full_name}" created successfully!`);
      setShowModal(false);
      setFormData({ admission_number: '', full_name: '', gender: 'male' });
      fetchStudents();
    } catch (err) {
      console.error('Student creation error:', err.response?.data);
      
      // Handle duplicate admission number
      if (err.response?.data?.admission_number) {
        showToast.error(`Admission number already exists: ${err.response.data.admission_number[0]}`);
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to create student';
        showToast.error(errorMsg);
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Student Management</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admission No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Full Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gender</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.student_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{student.admission_number}</td>
                <td className="px-4 py-3 text-gray-700">{student.full_name}</td>
                <td className="px-4 py-3 text-gray-700 capitalize">{student.gender}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                    {student.status || 'ACTIVE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No students found</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all relative z-10">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Add Student</h3>
              <p className="text-blue-100 text-sm mt-1">Register a new student in the system</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admission Number</label>
                <input
                  type="text"
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., ADM001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl">
                  ✓ Create Student
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
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
