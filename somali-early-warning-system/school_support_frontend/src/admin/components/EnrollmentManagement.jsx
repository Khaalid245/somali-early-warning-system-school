import { useState, useEffect } from 'react';
import { UserPlus, Users, Search } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: '',
    academic_year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollmentsRes, studentsRes, classroomsRes] = await Promise.all([
        api.get('/dashboard/admin/enrollments/'),
        api.get('/students/'),
        api.get('/dashboard/admin/classrooms/')
      ]);
      
      console.log('Enrollments response:', enrollmentsRes.data);
      console.log('Students response:', studentsRes.data);
      console.log('Classrooms response:', classroomsRes.data);
      
      // Handle enrollments
      let enrollmentsList = [];
      if (Array.isArray(enrollmentsRes.data)) {
        enrollmentsList = enrollmentsRes.data;
      } else if (enrollmentsRes.data.enrollments) {
        enrollmentsList = enrollmentsRes.data.enrollments;
      }
      
      // Handle students
      let studentsList = [];
      if (Array.isArray(studentsRes.data)) {
        studentsList = studentsRes.data;
      } else if (studentsRes.data.results && Array.isArray(studentsRes.data.results)) {
        studentsList = studentsRes.data.results;
      } else if (studentsRes.data.students) {
        studentsList = studentsRes.data.students;
      }
      
      // Handle classrooms
      let classroomsList = [];
      if (Array.isArray(classroomsRes.data)) {
        classroomsList = classroomsRes.data;
      } else if (classroomsRes.data.results && Array.isArray(classroomsRes.data.results)) {
        classroomsList = classroomsRes.data.results;
      } else if (classroomsRes.data.classrooms) {
        classroomsList = classroomsRes.data.classrooms;
      }
      
      setEnrollments(enrollmentsList);
      setStudents(studentsList);
      setClassrooms(classroomsList);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/dashboard/admin/enrollments/create/', formData);
      
      // Find student and classroom names for success message
      const student = students.find(s => s.student_id === parseInt(formData.student_id));
      const classroom = classrooms.find(c => c.class_id === parseInt(formData.class_id));
      
      showToast.success(`${student?.full_name || 'Student'} enrolled in ${classroom?.name || 'classroom'} successfully!`);
      setShowModal(false);
      setFormData({
        student_id: '',
        class_id: '',
        academic_year: new Date().getFullYear().toString()
      });
      fetchData();
    } catch (err) {
      console.error('Failed to enroll student:', err.response?.data);
      
      // Handle duplicate enrollment
      if (err.response?.data?.error && err.response.data.error.includes('already enrolled')) {
        showToast.error('Student is already enrolled in this classroom!');
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to enroll student';
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
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Student Enrollment</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {/* Enrollments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Admission No.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Classroom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Academic Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Enrollment Date</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.enrollment_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ cursor: 'pointer' }}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{enrollment.student_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{enrollment.student_id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{enrollment.classroom_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{enrollment.academic_year}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enrollments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No enrollments found</p>
        </div>
      )}

      {/* Enroll Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-lg max-w-md w-full mx-4 relative z-10" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div className="bg-green-600 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold text-white">Enroll Student</h3>
              <p className="text-green-50 text-sm mt-1">Assign a student to a classroom</p>
            </div>
            
            <form onSubmit={handleEnroll} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                {students.length === 0 && <p className="text-red-500 text-xs mb-2">No students available. Create students first in Student Management tab.</p>}
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required
                >
                  <option value="">Select Student ({students.length} available)</option>
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.full_name} ({student.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classroom</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all focus:outline-none focus:border-green-600"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #DCFCE7'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required
                >
                  <option value="">Select Classroom</option>
                  {classrooms.filter(c => c.is_active).map((classroom) => (
                    <option key={classroom.class_id} value={classroom.class_id}>
                      {classroom.name} ({classroom.academic_year})
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-[1.2] px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enroll
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
