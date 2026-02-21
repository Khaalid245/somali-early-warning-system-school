import { useState, useEffect } from 'react';
import { interventionMeetingApi } from '../../api/interventionApi';
import { showToast } from '../../utils/toast';
import RecordMeetingModal from './RecordMeetingModal';
import InterventionProgressTracker from './InterventionProgressTracker';

export default function InterventionManagement({ students = [] }) {
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [recurringStudents, setRecurringStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading intervention data...');
      const [meetingsRes, statsRes, recurringRes] = await Promise.all([
        interventionMeetingApi.listMeetings(filters),
        interventionMeetingApi.getDashboardStats(),
        interventionMeetingApi.getRecurringAbsences(),
      ]);

      console.log('Meetings response:', meetingsRes.data);
      console.log('Stats response:', statsRes.data);
      
      const meetingsData = Array.isArray(meetingsRes.data) ? meetingsRes.data : (meetingsRes.data.results || []);
      console.log('Meetings array:', meetingsData);
      
      setMeetings(meetingsData);
      setStats(statsRes.data);
      setRecurringStudents(recurringRes.data.recurring_students || []);
    } catch (error) {
      console.error('Load error:', error);
      console.error('Error response:', error.response?.data);
      showToast.error('Failed to load intervention data');
      setMeetings([]);
      setStats(null);
      setRecurringStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMeeting = (student) => {
    setSelectedStudent(student);
    setShowRecordModal(true);
  };

  const handleViewProgress = async (meeting) => {
    try {
      const res = await interventionMeetingApi.getMeeting(meeting.id);
      setSelectedMeeting(res.data);
      setShowProgressModal(true);
    } catch (error) {
      showToast.error('Failed to load meeting details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      improving: 'bg-green-100 text-green-800',
      not_improving: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Meetings</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total_meetings}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Active Cases</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.by_status.open + stats.by_status.monitoring}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">High Urgency</p>
            <p className="text-2xl font-bold text-red-600">{stats.high_urgency}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Overdue Follow-ups</p>
            <p className="text-2xl font-bold text-orange-600">{stats.overdue_followups}</p>
          </div>
        </div>
      )}

      {/* Recurring Absences Warning */}
      {recurringStudents.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {recurringStudents.length} Student(s) with Recurring Absences
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside">
                  {recurringStudents.slice(0, 3).map((s) => (
                    <li key={s.student}>
                      {s.student__full_name} - {s.intervention_count} interventions
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="monitoring">Monitoring</option>
              <option value="improving">Improving</option>
              <option value="not_improving">Not Improving</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Urgency Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            onClick={() => setShowRecordModal(true)}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            + Record New Meeting
          </button>
        </div>
      </div>

      {/* Meetings Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Root Cause</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No intervention meetings found
                  </td>
                </tr>
              ) : (
                meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{meeting.student_name}</p>
                        <p className="text-sm text-gray-500">{meeting.student_id_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(meeting.meeting_date).toLocaleDateString()}
                      <p className="text-xs text-gray-500">{meeting.days_since_meeting} days ago</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{meeting.root_cause?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(meeting.urgency_level)}`}>
                        {meeting.urgency_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {meeting.follow_up_date ? (
                        <span className={meeting.is_overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {new Date(meeting.follow_up_date).toLocaleDateString()}
                          {meeting.is_overdue && ' ⚠️'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{meeting.progress_count} update(s)</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewProgress(meeting)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Track Progress →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meetings Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No intervention meetings found
          </div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{meeting.student_name}</p>
                  <p className="text-sm text-gray-500">{meeting.student_id_number}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(meeting.urgency_level)}`}>
                  {meeting.urgency_level}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="text-gray-700">{new Date(meeting.meeting_date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{meeting.days_since_meeting} days ago</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                    {meeting.status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Root Cause</p>
                  <p className="text-gray-700">{meeting.root_cause?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Follow-up</p>
                  {meeting.follow_up_date ? (
                    <p className={meeting.is_overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {new Date(meeting.follow_up_date).toLocaleDateString()}
                      {meeting.is_overdue && ' ⚠️'}
                    </p>
                  ) : (
                    <p className="text-gray-400">Not set</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-gray-600">{meeting.progress_count} update(s)</p>
                <button
                  onClick={() => handleViewProgress(meeting)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Track Progress →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showRecordModal && (
        <RecordMeetingModal
          student={selectedStudent}
          students={students}
          onClose={() => {
            setShowRecordModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={loadData}
        />
      )}

      {showProgressModal && selectedMeeting && (
        <InterventionProgressTracker
          meeting={selectedMeeting}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedMeeting(null);
          }}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
