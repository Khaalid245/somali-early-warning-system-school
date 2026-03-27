import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Download, Printer, Plus, BookOpen, Users, Clock, Zap } from 'lucide-react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';

const TimetableManager = () => {
  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    classroom_id: '',
    teacher_id: '',
    subject_id: '',
    day_of_week: '',
    period: '',
    academic_year: '2024-2025',
    term: 'Term 1'
  });
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);

  const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' }
  ];

  const PERIODS = [
    { value: '1', label: 'Period 1', time: '8:00-8:45' },
    { value: '2', label: 'Period 2', time: '8:45-9:30' },
    { value: '3', label: 'Period 3', time: '9:45-10:30', note: 'After break' },
    { value: '4', label: 'Period 4', time: '10:30-11:15' },
    { value: '5', label: 'Period 5', time: '11:30-12:15', note: 'After break' },
    { value: '6', label: 'Period 6', time: '12:15-1:00' },
    { value: '7', label: 'Period 7', time: '2:00-2:45', note: 'After lunch' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [timetableRes, classroomsRes, teachersRes, subjectsRes] = await Promise.all([
        api.get('/academics/schedule/timetable/'),
        api.get('/students/classrooms/'),
        api.get('/users/?role=teacher'),
        api.get('/academics/subjects/')
      ]);
      
      setTimetableData(timetableRes.data);
      const classroomList = classroomsRes.data.results || classroomsRes.data || [];
      const teacherList = teachersRes.data.results || teachersRes.data || [];
      const subjectList = subjectsRes.data.results || subjectsRes.data || [];
      
      setClassrooms(classroomList);
      setTeachers(teacherList);
      setSubjects(subjectList);
      
      if (classroomList.length > 0) {
        setSelectedClassroom(classroomList[0].class_id);
      }

      calculateStats(timetableRes.data, classroomList, teacherList);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast.error('Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (timetable, classroomList, teacherList) => {
    const totalSlots = timetable?.schedule ? 
      Object.values(timetable.schedule).reduce((sum, periods) => sum + periods.length, 0) : 0;
    
    const teachersWithAssignments = new Set();
    const classroomsWithSchedule = new Set();
    
    if (timetable?.schedule) {
      Object.values(timetable.schedule).forEach(periods => {
        periods.forEach(p => {
          teachersWithAssignments.add(p.teacher);
          classroomsWithSchedule.add(p.classroom);
        });
      });
    }

    setStats({
      totalSlots,
      totalTeachers: teacherList.length,
      assignedTeachers: teachersWithAssignments.size,
      totalClassrooms: classroomList.length,
      scheduledClassrooms: classroomsWithSchedule.size,
      completionRate: classroomList.length > 0 ? 
        Math.round((classroomsWithSchedule.size / classroomList.length) * 100) : 0
    });
  };

  const getScheduleForClassroom = (classroomId) => {
    if (!timetableData?.schedule) return {};
    const filtered = {};
    Object.entries(timetableData.schedule).forEach(([day, periods]) => {
      const classroomPeriods = periods.filter(p => {
        const classroom = classrooms.find(c => c.name === p.classroom);
        return classroom?.class_id === classroomId;
      });
      if (classroomPeriods.length > 0) {
        filtered[day] = classroomPeriods;
      }
    });
    return filtered;
  };

  const getTeacherSchedule = () => {
    if (!timetableData?.schedule) return [];
    const teacherMap = {};
    Object.entries(timetableData.schedule).forEach(([day, periods]) => {
      periods.forEach(period => {
        const key = period.teacher;
        if (!teacherMap[key]) {
          teacherMap[key] = {
            teacher: period.teacher,
            email: period.teacher_email,
            periods: []
          };
        }
        teacherMap[key].periods.push({
          day,
          period: period.period,
          classroom: period.classroom,
          subject: period.subject
        });
      });
    });
    return Object.values(teacherMap).sort((a, b) => b.periods.length - a.periods.length);
  };

  const openCreateModal = (day = '', period = '') => {
    setModalMode('create');
    setFormData({
      classroom_id: selectedClassroom || '',
      teacher_id: '',
      subject_id: '',
      day_of_week: day,
      period: period,
      academic_year: '2024-2025',
      term: 'Term 1'
    });
    setConflicts([]);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post('/academics/schedule/timetable/create/', formData);
      showToast.success('Timetable entry created successfully');
      setShowModal(false);
      loadAllData();
    } catch (err) {
      console.error('Failed to create entry:', err);
      showToast.error(err.response?.data?.error || 'Failed to create timetable entry');
    }
  };

  const exportTimetable = () => {
    const classroom = classrooms.find(c => c.class_id === selectedClassroom);
    const schedule = getScheduleForClassroom(selectedClassroom);
    
    let csv = `Timetable for ${classroom?.name}\n\n`;
    csv += 'Period,' + DAYS.map(d => d.label).join(',') + '\n';
    
    PERIODS.forEach(period => {
      let row = `${period.label} (${period.time})`;
      DAYS.forEach(day => {
        const daySchedule = schedule[day.value] || [];
        const periodData = daySchedule.find(p => p.period === period.value);
        row += ',' + (periodData ? `${periodData.subject} - ${periodData.teacher}` : '-');
      });
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${classroom?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Timetable exported successfully');
  };

  const printTimetable = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <h1 className="text-base font-medium text-gray-900">School Timetable</h1>
              <p className="text-xs text-gray-400 mt-0.5">Period scheduling and class assignments</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAllData} className="px-3 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button onClick={exportTimetable} className="px-3 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button onClick={printTimetable} className="px-3 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white border border-gray-200 border-l-4 border-l-blue-400 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Teachers assigned</p>
              <p className="text-xl font-semibold text-gray-800">{stats.assignedTeachers}/{stats.totalTeachers}</p>
            </div>
            <div className="bg-white border border-gray-200 border-l-4 border-l-amber-400 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Classrooms scheduled</p>
              <p className="text-xl font-semibold text-gray-800">{stats.scheduledClassrooms}/{stats.totalClassrooms}</p>
            </div>
            <div className={`bg-white border border-gray-200 border-l-4 ${stats.completionRate === 100 ? 'border-l-green-400' : 'border-l-gray-300'} rounded-lg p-3`}>
              <p className="text-xs text-gray-500 mb-1">Completion</p>
              <p className="text-xl font-semibold text-gray-800">{stats.completionRate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
            viewMode === 'grid'
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Classroom grid
        </button>
        <button
          onClick={() => setViewMode('teacher')}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition flex items-center gap-1.5 ${
            viewMode === 'teacher'
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Teacher assignments
        </button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Classroom:</label>
                <select
                  value={selectedClassroom || ''}
                  onChange={(e) => setSelectedClassroom(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {classrooms.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => openCreateModal()}
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center gap-1.5 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add period
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left font-semibold w-32">Period / Time</th>
                  {DAYS.map(day => (
                    <th key={day.value} className="border border-gray-200 p-3 text-center font-semibold">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period.value} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-200 p-3 bg-gray-50">
                      <div className="font-semibold text-sm">{period.label}</div>
                      <div className="text-xs text-gray-600">{period.time}</div>
                      {period.note && <div className="text-xs text-gray-500 mt-1">{period.note}</div>}
                    </td>
                    {DAYS.map(day => {
                      const schedule = getScheduleForClassroom(selectedClassroom);
                      const daySchedule = schedule[day.value] || [];
                      const periodData = daySchedule.find(p => p.period === period.value);
                      
                      return (
                        <td key={day.value} className="border border-gray-200 p-2">
                          {periodData ? (
                            <div className="bg-white p-2 rounded-md border border-gray-200 hover:border-gray-300 transition">
                              <div className="font-medium text-gray-800 text-xs mb-1">{periodData.subject}</div>
                              <div className="text-gray-400 text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{periodData.teacher}</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openCreateModal(day.value, period.value)}
                              className="w-full h-full min-h-[60px] text-gray-300 hover:bg-gray-50 hover:text-gray-500 rounded transition flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher View */}
      {viewMode === 'teacher' && (
        <div className="bg-white rounded-lg" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">Teacher assignments</p>
            <p className="text-xs text-gray-400 mt-0.5">Weekly schedule per teacher</p>
          </div>
          
          <div className="p-4">
            {getTeacherSchedule().length > 0 ? (
              <div className="space-y-4">
                {getTeacherSchedule().map((teacherData, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                          {teacherData.teacher.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{teacherData.teacher}</p>
                          <p className="text-xs text-gray-400">{teacherData.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{teacherData.periods.length} periods/week</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {teacherData.periods.map((p, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-md p-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs text-gray-400 capitalize">{p.day}</span>
                            <span className="text-xs text-gray-400">· P{p.period}</span>
                          </div>
                          <p className="text-xs font-medium text-gray-700">{p.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.classroom}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}</div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg mb-4">No teacher assignments yet</p>
                <button
                  onClick={() => openCreateModal()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Create First Assignment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {modalMode === 'create' ? 'Add period' : 'Edit period'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Assign a subject and teacher to a slot</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classroom *</label>
                  <select
                    name="classroom_id"
                    value={formData.classroom_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Classroom</option>
                    {classrooms.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
                  <select
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Day</option>
                    {DAYS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period *</label>
                  <select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Period</option>
                    {PERIODS.map(p => (
                      <option key={p.value} value={p.value}>{p.label} ({p.time})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                >
                  {modalMode === 'create' ? 'Create Entry' : 'Update Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
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
};

export default TimetableManager;
