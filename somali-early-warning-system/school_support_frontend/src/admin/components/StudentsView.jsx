import { useState, useEffect } from 'react';
import { Users, BookOpen, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function StudentsView() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const res = await api.get('/students/classrooms/');
      const classroomsData = res.data.results || res.data || [];
      
      // Load students for each classroom
      const classroomsWithStudents = await Promise.all(
        classroomsData.map(async (classroom) => {
          try {
            const studentsRes = await api.get(`/students/?classroom=${classroom.class_id}`);
            return {
              ...classroom,
              students: studentsRes.data.results || studentsRes.data || []
            };
          } catch {
            return { ...classroom, students: [] };
          }
        })
      );
      
      setClassrooms(classroomsWithStudents);
    } catch (err) {
      showToast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId) => {
    // Just expand inline - don't load details
    setExpandedClass(studentId);
  };

  const getRiskBadge = (level) => {
    const badges = {
      critical: 'bg-purple-100 text-purple-800',
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return badges[level] || badges.low;
  };

  if (loading) {
    return <div className="text-center py-12">Loading classrooms...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Students by Classroom</h2>
            <p className="text-sm text-gray-600">View students grouped by their classrooms</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200">
          <span className="text-sm font-medium text-green-700">{classrooms.length} classrooms</span>
        </div>
      </div>

      <div className="space-y-4">
        {classrooms.map((classroom) => (
          <div key={classroom.class_id} className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Classroom Header */}
            <button
              onClick={() => setExpandedClass(expandedClass === classroom.class_id ? null : classroom.class_id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {expandedClass === classroom.class_id ? 
                  <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                }
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{classroom.name}</h3>
                  <p className="text-sm text-gray-600">
                    {classroom.students.length} students · Form Master: {classroom.form_master?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{classroom.academic_year}</span>
              </div>
            </button>

            {/* Students Table */}
            {expandedClass === classroom.class_id && (
              <div className="border-t border-gray-100">
                {classroom.students.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No students in this classroom</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Gender</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroom.students.map((student) => (
                        <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-mono font-medium text-gray-900">{student.admission_number}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900">{student.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-700 capitalize">{student.gender}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              student.is_active ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-800 border border-gray-200'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
