import { useState, useEffect } from 'react';
import { User, AlertTriangle, Calendar, FileText, ChevronDown, ChevronRight } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students by Classroom</h2>
          <p className="text-gray-600">View students grouped by their classrooms</p>
        </div>
        <div className="text-sm text-gray-600">{classrooms.length} classrooms</div>
      </div>

      <div className="space-y-4">
        {classrooms.map((classroom) => (
          <div key={classroom.class_id} className="bg-white rounded-lg shadow overflow-hidden">
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
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">{classroom.name}</h3>
                  <p className="text-sm text-gray-600">
                    {classroom.students.length} students · Form Master: {classroom.form_master?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">{classroom.academic_year}</div>
            </button>

            {/* Students Table */}
            {expandedClass === classroom.class_id && (
              <div className="border-t">
                {classroom.students.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No students in this classroom</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Gender</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classroom.students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{student.admission_number}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{student.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 capitalize">{student.gender}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
