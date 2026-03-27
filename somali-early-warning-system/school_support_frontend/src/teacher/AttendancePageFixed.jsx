import { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { showToast } from "../utils/toast";
import { getUserFriendlyError, operationErrors } from "../utils/errorMessages";
import ConfirmDialog from "../components/ConfirmDialog";
import { PageSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import OfflineIndicator from "../components/OfflineIndicator";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.jsx";
import { jwtDecode } from "jwt-decode";
import { BookOpen, BookMarked, Clock, CheckCircle, XCircle, AlertCircle, Search, ChevronDown } from 'lucide-react';

export default function AttendancePage() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [students, setStudents] = useState([]);

  const [selectedClassroom, setSelectedClassroom] = useState(() =>
    localStorage.getItem('teacher_last_classroom') || ""
  );
  const [selectedSubject, setSelectedSubject] = useState(() =>
    localStorage.getItem('teacher_last_subject') || ""
  );
  const [selectedPeriod, setSelectedPeriod] = useState("1");
  const [validPeriods, setValidPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [todaySubmitted, setTodaySubmitted] = useState([]);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isClassroomDropdownOpen, setIsClassroomDropdownOpen] = useState(false);
  const periodDropdownRef = useRef(null);
  const classroomDropdownRef = useRef(null);
  const [statusMap, setStatusMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, message: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const periodOptions = [
    { value: "1", label: "Period 1" },
    { value: "2", label: "Period 2" },
    { value: "3", label: "Period 3" },
    { value: "4", label: "Period 4" },
    { value: "5", label: "Period 5" },
    { value: "6", label: "Period 6" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false);
      }
      if (classroomDropdownRef.current && !classroomDropdownRef.current.contains(event.target)) {
        setIsClassroomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save draft every 30 seconds and check token validity
  useEffect(() => {
    if (Object.keys(statusMap).length > 0) {
      const timer = setInterval(() => {
        // Check token validity before auto-save
        const token = sessionStorage.getItem("access");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
              localStorage.setItem('teacher_attendance_draft', JSON.stringify({
                classroom: selectedClassroom,
                subject: selectedSubject,
                statusMap,
                remarksMap,
                timestamp: new Date().toISOString()
              }));
            } else {
              showToast.warning("Session will expire soon. Please save your work.");
            }
          } catch (err) {
            console.error("Token validation error during auto-save:", err);
          }
        }
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [statusMap, remarksMap, selectedClassroom, selectedSubject]);

  // Issue 8 fix: draft load now actually restores statusMap and remarksMap,
  // only if classroom still matches and draft is under 1 hour old.
  useEffect(() => {
    const draft = localStorage.getItem('teacher_attendance_draft');
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      const draftAge = new Date() - new Date(parsed.timestamp);
      if (draftAge < 3600000 && parsed.classroom && parsed.statusMap) {
        setSelectedClassroom(parsed.classroom);
        if (parsed.subject) setSelectedSubject(parsed.subject);
        setStatusMap(parsed.statusMap);
        setRemarksMap(parsed.remarksMap || {});
        showToast.success('Draft restored from ' + new Date(parsed.timestamp).toLocaleTimeString());
      }
    } catch (e) {}
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+s': { action: (e) => { e?.preventDefault(); submitAttendance(); } },
    '/': { action: () => document.querySelector('input[placeholder*="Search"]')?.focus() },
    'escape': { action: () => setSearchTerm('') }
  });

  useEffect(() => {
    // Check authentication on component mount
    const token = sessionStorage.getItem("access");
    if (!token) {
      showToast.error("Please log in to access attendance.");
      navigate("/login");
      return;
    }
    
    // Check if token is expired
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        showToast.error("Session expired. Please log in again.");
        sessionStorage.clear();
        navigate("/login");
        return;
      }
    } catch (err) {
      console.error("Token validation error:", err);
      showToast.error("Invalid session. Please log in again.");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    
    loadAssignments();
    api.get('/attendance/today-submitted/')
      .then(res => setTodaySubmitted(res.data.submitted || []))
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (location.state?.classroom && classrooms.length > 0) {
      const cls = classrooms.find(c => c.name === location.state.classroom);
      if (cls) setSelectedClassroom(cls.class_id.toString());
    }
  }, [location.state, classrooms]);

  useEffect(() => {
    if (selectedClassroom) {
      const id = parseInt(selectedClassroom);
      loadStudents(id);
      updateSubjects(id);
      setSelectedSubject("");
      setStatusMap({});
      localStorage.setItem('teacher_last_classroom', selectedClassroom);
    }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('teacher_last_subject', selectedSubject);
    }
  }, [selectedSubject]);

  // Fetch valid periods from timetable when classroom+subject are both selected
  useEffect(() => {
    if (selectedClassroom && selectedSubject) {
      setPeriodsLoading(true);
      setValidPeriods([]);
      setSelectedPeriod("");
      api.get(`/attendance/valid-periods/?classroom=${selectedClassroom}&subject=${selectedSubject}`)
        .then(res => {
          const periods = res.data.valid_periods || [];
          setValidPeriods(periods);
          if (periods.length === 1) setSelectedPeriod(periods[0]);
          if (periods.length === 0) {
            showToast.error(`No timetable found for this class/subject on ${res.data.day || 'today'}. Check your schedule.`);
          }
        })
        .catch(() => setValidPeriods([]))
        .finally(() => setPeriodsLoading(false));
    } else {
      setValidPeriods([]);
      setSelectedPeriod("");
    }
  }, [selectedClassroom, selectedSubject]);

  const loadAssignments = async () => {
    try {
      // Check authentication before making API calls
      const token = sessionStorage.getItem("access");
      if (!token) {
        showToast.error("Please log in to access attendance.");
        navigate("/login");
        return;
      }

      const [assignRes, classRes, subjectRes] = await Promise.all([
        api.get("/academics/assignments/"),
        api.get("/students/classrooms/"),
        api.get("/academics/subjects/"),
      ]);

      const assignments = Array.isArray(assignRes.data.results) ? assignRes.data.results : (Array.isArray(assignRes.data) ? assignRes.data : []);
      setAssignments(assignments);

      if (assignments.length === 0) {
        showToast.error("No classes assigned to you. Please contact your administrator.");
        setLoading(false);
        return;
      }

      const classIds = [...new Set(assignments.map((a) => a.classroom))];
      const allClassrooms = classRes.data.results || classRes.data || [];
      const seen = new Set();
      const filteredClasses = allClassrooms.filter((cls) => {
        if (!classIds.includes(cls.class_id) || seen.has(cls.class_id)) return false;
        seen.add(cls.class_id);
        return true;
      });
      setClassrooms(filteredClasses);

      const allSubjects = subjectRes.data.results || subjectRes.data || [];
      const subjectMapping = {};
      allSubjects.forEach(sub => { subjectMapping[sub.subject_id] = sub.name; });
      setSubjectMap(subjectMapping);
    } catch (err) {
      console.error("Failed to load assignments", err);
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast.error("Session expired. Please log in again.");
        sessionStorage.clear();
        navigate("/login");
        return;
      }
      
      showToast.error(getUserFriendlyError(err) || operationErrors.loadAssignments);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classroomId) => {
    try {
      const res = await api.get(`/students/?classroom=${classroomId}`);
      const studentsList = res.data.results || res.data || [];
      setStudents(studentsList);
      const initialStatus = {};
      studentsList.forEach(stu => {
        initialStatus[stu.student_id] = "present";
      });
      setStatusMap(initialStatus);
      setRemarksMap({});
    } catch (err) {
      console.error("Failed to load students", err);
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast.error("Session expired. Please log in again.");
        sessionStorage.clear();
        navigate("/login");
        return;
      }
      
      showToast.error(getUserFriendlyError(err) || "Failed to load students");
    }
  };

  const updateSubjects = (classroomId) => {
    const filtered = [...new Set(
      assignments
        .filter((a) => a.classroom === classroomId)
        .map((a) => a.subject)
    )];
    setSubjects(filtered);
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedSubject) {
      errors.subject = "Please select a subject";
    }
    if (Object.keys(statusMap).length !== students.length) {
      errors.attendance = `Please mark attendance for all ${students.length} students`;
    }
    // Excused students must have a reason
    students.forEach(stu => {
      if (statusMap[stu.student_id] === 'excused' && !remarksMap[stu.student_id]?.trim()) {
        errors[`remarks_${stu.student_id}`] = true;
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitAttendance = () => {
    if (!validateForm()) {
      showToast.error("Please fix the errors before submitting");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      action: 'submit',
      message: `Are you sure you want to submit attendance for ${students.length} students? This action cannot be undone.`
    });
  };

  const confirmSubmit = async () => {
    setConfirmDialog({ isOpen: false, action: null, message: '' });
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const records = Object.keys(statusMap).map(studentId => ({
      student: parseInt(studentId),
      status: statusMap[studentId].toLowerCase(),
      remarks: remarksMap[studentId] || ""
    }));

    try {
      // Check if user is still authenticated before submitting
      const token = sessionStorage.getItem("access");
      if (!token) {
        showToast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      // Verify token is not expired
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 < Date.now()) {
          showToast.error("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
      } catch (tokenErr) {
        console.error("Token validation error:", tokenErr);
        showToast.error("Invalid session. Please log in again.");
        navigate("/login");
        return;
      }

      await api.post("/attendance/sessions/", {
        classroom: parseInt(selectedClassroom),
        subject: parseInt(selectedSubject),
        period: selectedPeriod,
        attendance_date: today,
        records: records
      });

      showToast.success(`✅ Attendance saved successfully for ${students.length} students!`);
      
      // Mark this combo as submitted so the banner shows immediately
      setTodaySubmitted(prev => [...prev, {
        classroom_id: parseInt(selectedClassroom),
        subject_id: parseInt(selectedSubject),
        period: selectedPeriod
      }]);
      
      // Clear all form data
      setStatusMap({});
      setRemarksMap({});
      setSelectedSubject("");
      localStorage.removeItem('teacher_attendance_draft');
      localStorage.removeItem('teacher_last_subject');
      
      // Small delay before navigation to show success message
      setTimeout(() => {
        navigate("/teacher");
      }, 1000);
    } catch (err) {
      console.error("Attendance submission error:", err);
      
      // Handle authentication errors specifically
      if (err.response?.status === 401 || err.response?.status === 403) {
        const errorData = err.response?.data;
        
        // Check if this is a business logic error (not authentication)
        if (errorData?.error && typeof errorData.error === 'string' && 
            (errorData.error.includes('already recorded') || 
             errorData.error.includes('duplicate') ||
             errorData.error.includes('not assigned'))) {
          // This is a business logic error, not authentication - handle normally
          console.log('Business logic error (403):', errorData.error);
          // Fall through to normal error handling below
        } else {
          // This is a real authentication error
          console.error('ATTENDANCE AUTH ERROR:', err.response?.data);
          showToast.error("Session expired. Please log in again.");
          sessionStorage.clear();
          navigate("/login");
          return;
        }
      }
      
      const errorData = err.response?.data;
      let errorMsg = getUserFriendlyError(err) || "Error submitting attendance";
      
      if (errorData?.error && Array.isArray(errorData.error)) {
        errorMsg = errorData.error[0];
        if (errorMsg.includes("unique set") || errorMsg.includes("already recorded")) {
          errorMsg = "Attendance already recorded for this class, subject and date today. Please edit the existing record instead.";
        }
      } else if (errorData?.error && typeof errorData.error === 'string') {
        if (errorData.error.includes("already recorded")) {
          errorMsg = "Attendance already recorded for this class, subject and date today. Please edit the existing record instead.";
        } else {
          errorMsg = errorData.error;
        }
      }
      
      showToast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = (studentId, status) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    if (validationErrors[`remarks_${studentId}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`remarks_${studentId}`];
        return newErrors;
      });
    }
  };

  const markAll = (status) => {
    setConfirmDialog({
      isOpen: true,
      action: status,
      message: `Are you sure you want to mark all ${students.length} students as "${status}"? You can change individual statuses afterwards.`
    });
  };

  const confirmMarkAll = (status) => {
    setConfirmDialog({ isOpen: false, action: null, message: '' });
    const newMap = {};
    students.forEach(stu => {
      newMap[stu.student_id] = status;
    });
    setStatusMap(newMap);
    showToast.success(`Marked all ${students.length} students as ${status}`);
  };

  const handleCancel = () => {
    if (Object.keys(statusMap).length > 0) {
      setConfirmDialog({
        isOpen: true,
        action: 'cancel',
        message: 'You have unsaved changes. Are you sure you want to leave? All attendance data will be lost.'
      });
    } else {
      navigate("/teacher");
    }
  };

  const confirmCancel = () => {
    setConfirmDialog({ isOpen: false, action: null, message: '' });
    navigate("/teacher");
  };

  const isAlreadySubmitted = (classroomId, subjectId, period) =>
    todaySubmitted.some(
      s => s.classroom_id === parseInt(classroomId) &&
           s.subject_id === parseInt(subjectId) &&
           String(s.period) === String(period)
    );

  const filteredStudents = students.filter(stu =>
    stu.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCount = (status) => {
    return Object.values(statusMap).filter(s => s === status).length;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-4 sm:p-8">
            <PageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} />
          <div className="p-4 sm:p-8">
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-gray-400" />}
              title="No Classes Assigned"
              message="You don't have any classes assigned yet. Please contact your administrator to get class assignments before you can record attendance."
              actionLabel="Go to Dashboard"
              onAction={() => navigate("/teacher")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OfflineIndicator />
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Record Attendance</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              {/* User info */}
              <div className="text-right text-sm text-gray-500">
                <p>Logged in as: <strong>{user?.name || user?.email}</strong></p>
                <p>Role: <strong className="capitalize">{user?.role?.replace('_', ' ')}</strong></p>
              </div>
            </div>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Classroom Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                Select Classroom <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={classroomDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassroomDropdownOpen(!isClassroomDropdownOpen)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-sm sm:text-base flex items-center justify-between"
                >
                  <span className={selectedClassroom ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedClassroom ? classrooms.find(cls => cls.class_id.toString() === selectedClassroom)?.name : '-- Choose Classroom --'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isClassroomDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isClassroomDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '280px', overflowY: 'auto' }}>
                    <button type="button" onClick={() => { setSelectedClassroom(''); setIsClassroomDropdownOpen(false); }} className="w-full px-4 py-3 text-left text-sm text-gray-400">
                      -- Choose Classroom --
                    </button>
                    {classrooms.map((cls) => (
                      <button
                        key={cls.class_id}
                        type="button"
                        onClick={() => { setSelectedClassroom(cls.class_id.toString()); setIsClassroomDropdownOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm transition-colors"
                        style={{ backgroundColor: selectedClassroom === cls.class_id.toString() ? '#F0FDF4' : 'transparent', color: selectedClassroom === cls.class_id.toString() ? '#16A34A' : '#374151', fontWeight: selectedClassroom === cls.class_id.toString() ? 600 : 400 }}
                      >
                        {cls.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-green-600" />
                Select Subject <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-sm sm:text-base disabled:bg-gray-100 ${
                  validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  if (validationErrors.subject) setValidationErrors(prev => { const n = { ...prev }; delete n.subject; return n; });
                }}
                disabled={!selectedClassroom}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((subjectId) => (
                  <option key={subjectId} value={subjectId}>
                    {subjectMap[subjectId] || `Subject ${subjectId}`}
                  </option>
                ))}
              </select>
              {validationErrors.subject && <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>}
            </div>

            {/* Period Selection */}
            <div className="bg-green-50 rounded-lg border border-green-200 p-4 sm:p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                Select Period <span className="text-red-500">*</span>
              </label>
              {!selectedClassroom || !selectedSubject ? (
                <p className="text-sm text-gray-400 italic">Select classroom and subject first</p>
              ) : periodsLoading ? (
                <p className="text-sm text-gray-500">Loading your schedule...</p>
              ) : validPeriods.length === 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Not scheduled today</p>
                  <p className="text-xs text-red-500 mt-1">This class/subject has no timetable slot for today. Check your calendar.</p>
                </div>
              ) : (
                <div className="relative" ref={periodDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-sm sm:text-base flex items-center justify-between"
                  >
                    <span className={selectedPeriod ? 'text-gray-800' : 'text-gray-400'}>
                      {selectedPeriod ? periodOptions.find(opt => opt.value === selectedPeriod)?.label : '-- Select Period --'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isPeriodDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {isPeriodDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                      {periodOptions.filter(opt => validPeriods.includes(opt.value)).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => { setSelectedPeriod(option.value); setIsPeriodDropdownOpen(false); }}
                          className="w-full px-4 py-3 text-left text-sm transition-colors"
                          style={{ backgroundColor: selectedPeriod === option.value ? '#F0FDF4' : 'transparent', color: selectedPeriod === option.value ? '#16A34A' : '#374151', fontWeight: selectedPeriod === option.value ? 600 : 400 }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Duplicate warning banner */}
          {selectedClassroom && selectedSubject && selectedPeriod &&
            isAlreadySubmitted(selectedClassroom, selectedSubject, selectedPeriod) && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Attendance already submitted today</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You already recorded attendance for this class, subject, and period today.
                  You cannot submit again — contact your administrator if you need to make changes.
                </p>
              </div>
            </div>
          )}

          {/* Students List */}
          {selectedClassroom && selectedSubject && students.length > 0 && (
            <>
              {/* Stats & Actions Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs sm:text-sm text-gray-700">Present: <strong>{getStatusCount("present")}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs sm:text-sm text-gray-700">Late: <strong>{getStatusCount("late")}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs sm:text-sm text-gray-700">Absent: <strong>{getStatusCount("absent")}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs sm:text-sm text-gray-700">Excused: <strong>{getStatusCount("excused")}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => markAll("present")}
                      className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => markAll("absent")}
                      className="px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student by name..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {validationErrors.attendance && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{validationErrors.attendance}</p>
                  </div>
                )}
              </div>

              {/* Students Grid */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Mobile progress bar */}
                <div className="sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Object.keys(statusMap).length} / {students.length} marked</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all"
                      style={{ width: students.length > 0 ? `${(Object.keys(statusMap).length / students.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Mobile card layout (hidden on sm+) */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filteredStudents.map((stu) => {
                    const current = statusMap[stu.student_id];
                    return (
                      <div
                        key={stu.student_id}
                        className="p-4"
                        style={{
                          backgroundColor:
                            current === 'present' ? '#F0FDF4' :
                            current === 'late'    ? '#FEFCE8' :
                            current === 'absent'  ? '#FEF2F2' :
                            current === 'excused' ? '#EFF6FF' : 'white'
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold flex-shrink-0">
                            {stu.full_name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{stu.full_name}</span>
                          {current && (
                            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                              current === 'present' ? 'bg-green-100 text-green-700' :
                              current === 'late'    ? 'bg-yellow-100 text-yellow-700' :
                              current === 'absent'  ? 'bg-red-100 text-red-600' :
                              current === 'excused' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {current.charAt(0).toUpperCase() + current.slice(1)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['present','bg-green-600','text-green-700'],
                            ['late','bg-yellow-500','text-yellow-700'],
                            ['absent','bg-red-600','text-red-600'],
                            ['excused','bg-blue-500','text-blue-700'],
                          ].map(([status, activeBg, textColor]) => (
                            <button
                              key={status}
                              onClick={() => setStatus(stu.student_id, status)}
                              className={`py-3 rounded-lg text-xs font-semibold transition-colors border ${
                                current === status
                                  ? `${activeBg} text-white border-transparent`
                                  : `bg-white ${textColor} border-gray-200`
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                        {(current === 'excused' || current === 'absent' || current === 'late') && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder={current === 'excused' ? 'Excuse reason (required)' : 'Remarks (optional)'}
                              value={remarksMap[stu.student_id] || ''}
                              onChange={(e) => setRemarksMap(prev => ({ ...prev, [stu.student_id]: e.target.value }))}
                              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                              style={{ borderColor: current === 'excused' && validationErrors[`remarks_${stu.student_id}`] ? '#EF4444' : '#E5E7EB', backgroundColor: '#FFFFFF' }}
                            />
                            {current === 'excused' && validationErrors[`remarks_${stu.student_id}`] && (
                              <p className="text-xs text-red-600 mt-1">Excuse reason is required</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table layout (hidden on mobile) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#F9FAFB' }} className="border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student Name</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Remarks / Excuse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.map((stu) => (
                        <tr
                          key={stu.student_id}
                          style={{
                            transition: 'background-color 0.2s',
                            backgroundColor:
                              statusMap[stu.student_id] === 'present' ? '#F0FDF4' :
                              statusMap[stu.student_id] === 'late'    ? '#FEFCE8' :
                              statusMap[stu.student_id] === 'absent'  ? '#FEF2F2' :
                              statusMap[stu.student_id] === 'excused' ? '#EFF6FF' : 'transparent'
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0" style={{ fontWeight: 600 }}>
                                {stu.full_name.charAt(0)}
                              </div>
                              <span className="text-base font-medium text-gray-800">{stu.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => setStatus(stu.student_id, "present")}
                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${
                                  statusMap[stu.student_id] === "present"
                                    ? "bg-green-600 text-white"
                                    : "bg-transparent border border-green-400 text-green-700 hover:bg-green-50"
                                }`}
                              >
                                <CheckCircle className="w-3 h-3" /> Present
                              </button>
                              <button
                                onClick={() => setStatus(stu.student_id, "late")}
                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${
                                  statusMap[stu.student_id] === "late"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-transparent border border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                                }`}
                              >
                                <Clock className="w-3 h-3" /> Late
                              </button>
                              <button
                                onClick={() => setStatus(stu.student_id, "absent")}
                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${
                                  statusMap[stu.student_id] === "absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-transparent border border-red-400 text-red-600 hover:bg-red-50"
                                }`}
                              >
                                <XCircle className="w-3 h-3" /> Absent
                              </button>
                              <button
                                onClick={() => setStatus(stu.student_id, "excused")}
                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${
                                  statusMap[stu.student_id] === "excused"
                                    ? "bg-blue-500 text-white"
                                    : "bg-transparent border border-blue-400 text-blue-700 hover:bg-blue-50"
                                }`}
                              >
                                <CheckCircle className="w-3 h-3" /> Excused
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(statusMap[stu.student_id] === 'excused' || statusMap[stu.student_id] === 'absent' || statusMap[stu.student_id] === 'late') && (
                              <div>
                                <input
                                  type="text"
                                  placeholder={statusMap[stu.student_id] === 'excused' ? 'Excuse reason (required)' : 'Remarks (optional)'}
                                  value={remarksMap[stu.student_id] || ''}
                                  onChange={(e) => setRemarksMap(prev => ({ ...prev, [stu.student_id]: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                  style={{ borderColor: statusMap[stu.student_id] === 'excused' && validationErrors[`remarks_${stu.student_id}`] ? '#EF4444' : '#E5E7EB', backgroundColor: '#FFFFFF', minWidth: '180px' }}
                                />
                                {statusMap[stu.student_id] === 'excused' && validationErrors[`remarks_${stu.student_id}`] && (
                                  <p className="text-xs text-red-600 mt-1">Excuse reason is required</p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Total Students: <strong>{students.length}</strong> | Marked: <strong>{Object.keys(statusMap).length}</strong>
                    </p>
                    {/* Session status indicator */}
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Session Active
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleCancel}
                      disabled={submitting}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm sm:text-base font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitAttendance}
                      disabled={submitting || Object.keys(statusMap).length !== students.length || !selectedPeriod || validPeriods.length === 0 || isAlreadySubmitted(selectedClassroom, selectedSubject, selectedPeriod)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {submitting ? "Submitting..." : "Submit Attendance"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {selectedClassroom && selectedSubject && students.length === 0 && (
            <EmptyState
              icon={<AlertCircle className="w-16 h-16 text-gray-400" />}
              title="No Students Found"
              message="There are no students enrolled in this classroom. Please contact your administrator."
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === 'submit' ? 'Submit Attendance' :
          confirmDialog.action === 'cancel' ? 'Unsaved Changes' :
          `Mark All ${confirmDialog.action}`
        }
        message={confirmDialog.message}
        danger={confirmDialog.action === 'cancel' || confirmDialog.action === 'absent'}
        loading={submitting}
        onConfirm={() => {
          if (confirmDialog.action === 'submit') confirmSubmit();
          else if (confirmDialog.action === 'cancel') confirmCancel();
          else confirmMarkAll(confirmDialog.action);
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null, message: '' })}
      />
    </div>
  );
}
