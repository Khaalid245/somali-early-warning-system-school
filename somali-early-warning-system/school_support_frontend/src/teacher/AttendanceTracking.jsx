import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/apiClient';

export default function AttendanceTracking() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tracking');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await api.get('/attendance/tracking/classes/');
      setClasses(res.data.classes);
    } catch (err) {
      console.error('Failed to load classes', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/tracking/class/${classId}/students/`);
      setStudents(res.data.students);
      setSelectedClass(classId);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-700',
      'B': 'bg-blue-100 text-blue-700',
      'C': 'bg-yellow-100 text-yellow-700',
      'D': 'bg-orange-100 text-orange-700',
      'F': 'bg-red-100 text-red-700'
    };
    return colors[grade] || 'bg-gray-100 text-gray-700';
  };

  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && classes.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-8">
        {/* Class Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Select a Class</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <button
                key={cls.class_id}
                onClick={() => loadStudents(cls.class_id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  selectedClass === cls.class_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <p className="font-bold text-gray-800">{cls.class_name}</p>
                <p className="text-sm text-gray-600">{cls.subject}</p>
                <p className="text-xs text-gray-500 mt-2">Total Sessions: {cls.total_sessions}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        {selectedClass && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Students</h2>
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left py-4 px-4 font-bold text-gray-700">Student Name</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-700">Admission #</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Total Sessions</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Present</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Absent</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Late</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Excused</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Attendance %</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Grade</th>
                      <th className="text-center py-4 px-4 font-bold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-4 font-semibold text-gray-800">{student.student_name}</td>
                        <td className="py-4 px-4 text-gray-600">{student.admission_number}</td>
                        <td className="py-4 px-4 text-center text-gray-800">{student.total_sessions}</td>
                        <td className="py-4 px-4 text-center text-green-600 font-semibold">{student.present_count}</td>
                        <td className="py-4 px-4 text-center text-red-600 font-semibold">{student.absent_count}</td>
                        <td className="py-4 px-4 text-center text-orange-600 font-semibold">{student.late_count}</td>
                        <td className="py-4 px-4 text-center text-blue-600 font-semibold">{student.excused_count || 0}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                              student.attendance_percentage >= 85 ? 'bg-green-100 text-green-700' :
                              student.attendance_percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.attendance_percentage}%
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  student.attendance_percentage >= 85 ? 'bg-green-500' :
                                  student.attendance_percentage >= 75 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${student.attendance_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(student.grade)}`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => navigate(`/teacher/attendance-history/${student.student_id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl">No students found</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
