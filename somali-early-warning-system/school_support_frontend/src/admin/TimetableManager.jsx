import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Download, Printer, Users } from 'lucide-react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';
import TimetableStats from './components/timetable/TimetableStats';
import TimetableGrid from './components/timetable/TimetableGrid';
import TeacherScheduleView from './components/timetable/TeacherScheduleView';
import TimetableModal from './components/timetable/TimetableModal';

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
  const [stats, setStats] = useState(null);

  // Somalia school week: Saturday–Thursday (Friday is holiday)
  const DAYS = [
    { value: 'saturday',  label: 'Saturday'  },
    { value: 'sunday',    label: 'Sunday'    },
    { value: 'monday',    label: 'Monday'    },
    { value: 'tuesday',   label: 'Tuesday'   },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday',  label: 'Thursday'  },
  ];

  const PERIODS = [
    { value: '1', label: 'Period 1', time: '8:00-8:45'   },
    { value: '2', label: 'Period 2', time: '8:45-9:30'   },
    { value: '3', label: 'Period 3', time: '9:30-10:15'  },
    { value: '4', label: 'Period 4', time: '11:00-11:45' },
    { value: '5', label: 'Period 5', time: '11:45-12:30' },
    { value: '6', label: 'Period 6', time: '12:30-13:15' },
  ];

  useEffect(() => {
    loadAllData();
    window.addEventListener('timetableChanged', loadAllData);
    return () => window.removeEventListener('timetableChanged', loadAllData);
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
      if (err.response?.status === 429) {
        showToast.error('Too many requests. Please contact admin to increase rate limit for authenticated users.');
      } else {
        showToast.error('Failed to load timetable data');
      }
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

  const generateTimetable = async () => {
    if (!selectedClassroom) { showToast.error('Select a classroom first'); return; }
    try {
      setLoading(true);
      await api.post('/academics/schedule/timetable/generate/', {
        classroom_id: selectedClassroom,
        academic_year: '2024-2025',
        term: 'Term 1'
      });
      showToast.success('Timetable generated successfully');
      loadAllData();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Generation failed');
      setLoading(false);
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
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">School Timetable</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Period scheduling and class assignments</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadAllData} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={generateTimetable} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>Auto-Generate</span>
            </button>
            <button onClick={exportTimetable} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={printTimetable} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        <TimetableStats stats={stats} />
      </div>

      {/* View Toggle */}
      <div className="mb-4 sm:mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
            viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Classroom Grid</span>
          <span className="sm:hidden">Grid</span>
        </button>
        <button
          onClick={() => setViewMode('teacher')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
            viewMode === 'teacher' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Teacher Assignments</span>
          <span className="sm:hidden">Teachers</span>
        </button>
      </div>

      {/* Views */}
      {viewMode === 'grid' ? (
        <TimetableGrid
          classrooms={classrooms}
          selectedClassroom={selectedClassroom}
          setSelectedClassroom={setSelectedClassroom}
          schedule={getScheduleForClassroom(selectedClassroom)}
          DAYS={DAYS}
          PERIODS={PERIODS}
          openCreateModal={openCreateModal}
          onDeleteEntry={async (timetableId) => {
            try {
              await api.delete(`/academics/schedule/timetable/${timetableId}/delete/`);
              showToast.success('Entry deleted');
              loadAllData();
            } catch { showToast.error('Delete failed'); }
          }}
        />
      ) : (
        <TeacherScheduleView
          teacherSchedule={getTeacherSchedule()}
          openCreateModal={openCreateModal}
        />
      )}

      {/* Modal */}
      <TimetableModal
        showModal={showModal}
        modalMode={modalMode}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        setShowModal={setShowModal}
        classrooms={classrooms}
        teachers={teachers}
        subjects={subjects}
        DAYS={DAYS}
        PERIODS={PERIODS}
      />
    </div>
  );
};

export default TimetableManager;
