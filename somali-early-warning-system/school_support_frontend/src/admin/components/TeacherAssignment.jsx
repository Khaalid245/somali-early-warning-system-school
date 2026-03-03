import { useState, useEffect } from 'react';
import { BookOpen, Plus, Users } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function TeacherAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    class_id: '',
    subject_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, teachersRes, classroomsRes, subjectsRes] = await Promise.all([
        api.get('/dashboard/admin/assignments/'),
        api.get('/dashboard/admin/users/?role=teacher'),
        api.get('/dashboard/admin/classrooms/'),
        api.get('/academics/subjects/')
      ]);
      
      setAssignments(assignmentsRes.data.assignments);
      setTeachers(teachersRes.data.users.filter(u => u.is_active));
      setClassrooms(classroomsRes.data.classrooms.filter(c => c.is_active));
      
      // Handle both possible response formats
      const subjectsData = subjectsRes.data.subjects || subjectsRes.data.results || subjectsRes.data || [];
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/dashboard/admin/assignments/create/', formData);
      
      // Find names for success message
      const teacher = teachers.find(t => t.user_id === parseInt(formData.teacher_id));
      const subject = subjects.find(s => s.subject_id === parseInt(formData.subject_id));
      const classroom = classrooms.find(c => c.class_id === parseInt(formData.class_id));
      
      showToast.success(`${teacher?.name || 'Teacher'} assigned to teach ${subject?.name || 'subject'} in ${classroom?.name || 'classroom'}!`);
      setShowModal(false);
      setFormData({ teacher_id: '', class_id: '', subject_id: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to assign teacher:', err.response?.data);
      
      // Handle duplicate assignment
      if (err.response?.data?.error && err.response.data.error.includes('already exists')) {
        showToast.error('This teaching assignment already exists!');
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to assign teacher';
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Teacher Assignment</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Assign Teacher
        </button>
      </div>

      {/* Assignments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Teacher</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.assignment_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{assignment.teacher_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{assignment.classroom_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{assignment.subject_name}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No assignments found</p>
        </div>
      )}

      {/* Assign Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0" onClick={() => setShowModal(false)} style={{ pointerEvents: 'auto' }}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative" style={{ pointerEvents: 'auto', zIndex: 100 }}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Assign Teacher</h3>
              <p className="text-blue-100 text-sm mt-1">Assign a teacher to a class and subject</p>
            </div>
            
            <form onSubmit={handleAssign} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Classroom</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.class_id} value={classroom.class_id}>
                      {classroom.name} ({classroom.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                >
                  ✓ Assign Teacher
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
