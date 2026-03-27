import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/apiClient';
import { History, ArrowLeft, Filter, Calendar, CheckCircle, XCircle, Clock, FileText, TrendingUp } from 'lucide-react';

export default function AttendanceHistory() {
  const { studentId } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: ''
  });

  useEffect(() => {
    loadHistory();
  }, [studentId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/attendance/tracking/student/${studentId}/history/?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': 'bg-green-50 text-green-700 border-green-200',
      'absent': 'bg-red-50 text-red-700 border-red-200',
      'late': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'excused': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading attendance history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-8 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-red-600">Failed to load data</p>
              <button onClick={loadHistory} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Retry
              </button>
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
        <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />

        <div className="p-8">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-8 h-8 text-green-600" />
                  Attendance History
                </h1>
                <p className="text-gray-600 mt-1">{data.student.name} - {data.student.admission_number}</p>
              </div>
              <button
                onClick={() => navigate('/teacher/attendance-tracking')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tracking
              </button>
            </div>
          </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Total Sessions</p>
            <p className="text-3xl font-semibold text-gray-800">{data.stats.total_sessions}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Present</p>
            <p className="text-3xl font-semibold text-green-600">{data.stats.present_count}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Excused</p>
            <p className="text-3xl font-semibold" style={{ color: '#6B7280' }}>{data.stats.excused_count}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Absent</p>
            <p className="text-3xl font-semibold text-red-600">{data.stats.absent_count}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Attendance %</p>
            <p className="text-3xl font-semibold text-green-600">{data.stats.attendance_percentage}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p className="text-gray-600 text-sm mb-2">Grade</p>
            <span className="inline-block px-4 py-2 rounded-full text-2xl font-semibold" style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
              {data.stats.grade}
            </span>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        {data.monthly_summary && data.monthly_summary.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Monthly Attendance Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly_summary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-600" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-green-600" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-green-600" />
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadHistory}
                className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Attendance History Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Attendance Records</h2>
          {data.history && data.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#F9FAFB' }} className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Subject</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Classroom</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.history.map((record, idx) => (
                    <tr key={idx} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-4 px-4 text-gray-800">{record.date}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{record.time}</td>
                      <td className="py-4 px-4 text-gray-800">{record.subject}</td>
                      <td className="py-4 px-4 text-gray-600">{record.classroom}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{record.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">No attendance records found</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
