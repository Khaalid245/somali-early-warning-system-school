import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AttendanceSessionsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/attendance/sessions/");
      setSessions(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load attendance sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={() => {}} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-4 sm:p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading sessions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={() => {}} />
      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              📝 Edit Attendance Sessions
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Select a session to edit attendance records</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadSessions}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {sessions.length === 0 && !loading && !error ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
              <p className="text-4xl mb-4">📝</p>
              <p className="text-xl text-gray-500 mb-2">No attendance sessions found</p>
              <p className="text-gray-400 mb-4">Take attendance to see sessions here</p>
              <button
                onClick={() => navigate('/teacher/attendance')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Take New Attendance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const isEditable = true; // You can add logic here
                const attendanceDate = new Date(session.attendance_date || session.created_at);
                
                return (
                  <div key={session.session_id || session.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {session.subject?.name || session.subject_name || 'Subject'}
                        </h3>
                        <p className="text-gray-600 mb-1">
                          {session.classroom?.name || session.classroom_name || 'Classroom'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {attendanceDate.toLocaleDateString()}
                        </p>
                      </div>
                      {isEditable && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Editable
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Records:</span>
                        <span className="font-semibold">{session.total_students || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Present:</span>
                        <span className="font-semibold text-green-600">{session.present_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Absent:</span>
                        <span className="font-semibold text-red-600">{session.absent_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600">Late:</span>
                        <span className="font-semibold text-yellow-600">{session.late_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/teacher/edit-attendance/${session.session_id || session.id}`)}
                        disabled={!isEditable}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
                      >
                        Edit Attendance
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}