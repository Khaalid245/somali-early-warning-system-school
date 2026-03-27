import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/apiClient';
import { BarChart3, Search, Eye, TrendingUp, TrendingDown } from 'lucide-react';

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
      const seen = new Set();
      const unique = (res.data.classes || []).filter(c => {
        if (seen.has(c.class_id)) return false;
        seen.add(c.class_id);
        return true;
      });
      setClasses(unique);
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
      'A': 'bg-green-50 text-green-700 border-green-200',
      'B': 'bg-blue-50 text-blue-700 border-blue-200',
      'C': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'D': 'bg-orange-50 text-orange-700 border-orange-200',
      'F': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[grade] || 'bg-gray-50 text-gray-700 border-gray-200';
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
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Select a Class
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <button
                key={cls.class_id}
                onClick={() => loadStudents(cls.class_id)}
                className={`p-4 rounded-lg transition-colors text-left ${
                  selectedClass === cls.class_id
                    ? ''
                    : 'hover:bg-green-50'
                }`}
                style={{
                  border: selectedClass === cls.class_id ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                  backgroundColor: selectedClass === cls.class_id ? '#F0FDF4' : 'transparent'
                }}
              >
                <p className="font-semibold text-gray-800">{cls.class_name}</p>
                <p className="text-sm text-gray-600">{cls.subject}</p>
                <p className="text-xs text-gray-500 mt-2">Total Sessions: {cls.total_sessions}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        {selectedClass && (
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Students</h2>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors w-full sm:w-80"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#F9FAFB' }} className="border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Student Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Admission #</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Total Sessions</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Present</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Absent</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Late</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Excused</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Attendance %</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Grade</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.student_id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td className="py-4 px-4 font-semibold text-gray-800">{student.student_name}</td>
                        <td className="py-4 px-4 text-gray-600">{student.admission_number}</td>
                        <td className="py-4 px-4 text-center text-gray-800">{student.total_sessions}</td>
                        <td className="py-4 px-4 text-center text-green-600 font-semibold">{student.present_count}</td>
                        <td className="py-4 px-4 text-center text-red-600 font-semibold">{student.absent_count}</td>
                        <td className="py-4 px-4 text-center font-semibold" style={{ color: '#92400E' }}>{student.late_count}</td>
                        <td className="py-4 px-4 text-center font-semibold" style={{ color: '#6B7280' }}>{student.excused_count || 0}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full font-semibold text-sm border ${
                              student.attendance_percentage >= 85 ? 'bg-green-50 text-green-700 border-green-200' :
                              student.attendance_percentage >= 75 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {student.attendance_percentage}%
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${student.attendance_percentage}%`,
                                  backgroundColor: student.attendance_percentage >= 85 ? '#22C55E' :
                                                   student.attendance_percentage >= 75 ? '#EAB308' :
                                                   '#F87171'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-semibold border ${getGradeColor(student.grade)}`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => navigate(`/teacher/attendance-history/${student.student_id}`)}
                            className="px-2.5 py-1 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 mx-auto"
                            style={{ backgroundColor: '#16A34A' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
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
