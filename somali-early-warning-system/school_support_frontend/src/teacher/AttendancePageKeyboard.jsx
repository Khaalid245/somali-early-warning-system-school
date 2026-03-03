import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import ResponsiveTable from "../components/ResponsiveTable";
import { useKeyboardShortcuts, KeyboardShortcutsHelp, TEACHER_SHORTCUTS } from "../hooks/useKeyboardShortcuts";

export default function AttendancePageWithShortcuts() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [students, setStudents] = useState([]);

  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [statusMap, setStatusMap] = useState({});
  const [bulkAction, setBulkAction] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [focusedStudentIndex, setFocusedStudentIndex] = useState(0);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+?': { action: () => setShowShortcutsHelp(true) },
    'f1': { action: () => setShowShortcutsHelp(true) },
    'ctrl+r': { action: () => window.location.reload() },
    'ctrl+d': { action: () => navigate('/teacher/dashboard') },
    'ctrl+s': { action: () => navigate('/teacher/students') },
    'ctrl+h': { action: () => navigate('/teacher/attendance-tracking') },
    'escape': { action: () => setShowShortcutsHelp(false) },
    
    // Attendance marking shortcuts (when students are loaded)
    'p': { 
      action: () => {
        if (students.length > 0 && focusedStudentIndex < students.length) {
          const student = students[focusedStudentIndex];
          setStatus(student.student_id, 'present');
          moveFocus(1);
        }
      }
    },
    'l': { 
      action: () => {
        if (students.length > 0 && focusedStudentIndex < students.length) {
          const student = students[focusedStudentIndex];
          setStatus(student.student_id, 'late');
          moveFocus(1);
        }
      }
    },
    'x': { 
      action: () => {
        if (students.length > 0 && focusedStudentIndex < students.length) {
          const student = students[focusedStudentIndex];
          setStatus(student.student_id, 'absent');
          moveFocus(1);
        }
      }
    },
    
    // Bulk operations
    'ctrl+shift+p': { 
      action: () => {
        if (students.length > 0) {
          const newStatusMap = {};
          students.forEach(student => {
            newStatusMap[student.student_id] = 'present';
          });
          setStatusMap(newStatusMap);
        }
      }
    },
    'ctrl+shift+a': { 
      action: () => {
        if (students.length > 0) {
          const newStatusMap = {};
          students.forEach(student => {
            newStatusMap[student.student_id] = 'absent';
          });
          setStatusMap(newStatusMap);
        }
      }
    },
    
    // Navigation within student list
    'arrowdown': { 
      action: () => moveFocus(1)
    },
    'arrowup': { 
      action: () => moveFocus(-1)
    },
    
    // Submit attendance
    'ctrl+enter': { 
      action: () => {
        if (selectedClassroom && selectedSubject && Object.keys(statusMap).length === students.length) {
          handleSubmitClick();
        }
      }
    }
  });

  const moveFocus = (direction) => {
    if (students.length === 0) return;
    
    setFocusedStudentIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex < 0) return students.length - 1;
      if (newIndex >= students.length) return 0;
      return newIndex;
    });
  };

  // Load assignments and classrooms
  const loadAssignments = async () => {
    try {
      const res = await api.get("/academics/assignments/");
      const myAssignments = res.data.filter((a) => a.teacher === user.user_id);
      setAssignments(myAssignments);

      const classIds = [...new Set(myAssignments.map((a) => a.classroom))];
      const classRes = await api.get("/students/classrooms/");
      const filteredClasses = classRes.data.filter((cls) =>
        classIds.includes(cls.class_id),
      );
      setClassrooms(filteredClasses);
      
      const subjectRes = await api.get("/academics/subjects/");
      const subjectMapping = {};
      subjectRes.data.forEach(sub => {
        subjectMapping[sub.subject_id] = sub.name;
      });
      setSubjectMap(subjectMapping);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  const loadStudents = async (classroomId) => {
    try {
      const res = await api.get(`/students/?classroom=${classroomId}`);
      setStudents(res.data);
      setFocusedStudentIndex(0);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const updateSubjects = (classroomId) => {
    const filtered = assignments
      .filter((a) => a.classroom === classroomId)
      .map((a) => a.subject);
    setSubjects(filtered);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

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
    }
  }, [selectedClassroom]);

  const handleSubmitClick = () => {
    if (!selectedSubject) {
      aler"Select a subject first!";
      return;
    }

    if (Object.keys(statusMap).length !== students.length) {
      alert(`Please mark attendance for all ${students.length} students. Currently marked: ${Object.keys(statusMap).length}`);
      return;
    }

    setShowConfirmDialog(true);
  };

  const submitAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    const records = Object.keys(statusMap).map(studentId => ({
      student: parseInt(studentId),
      status: statusMap[studentId].toLowerCase(),
      remarks: ""
    }));

    try {
      await api.post("/attendance/sessions/", {
        classroom: parseInt(selectedClassroom),
        subject: parseInt(selectedSubject),
        attendance_date: today,
        records: records
      });

      aler"Attendance saved successfully!";
      setStatusMap({});
      setSelectedStudents(new Set());
    } catch (err) {
      console.error("Submit Error:", err.response?.data || err);
      const errorData = err.response?.data;
      let errorMsg = "Error submitting attendance";
      
      if (errorData?.error && Array.isArray(errorData.error)) {
        errorMsg = errorData.error[0];
        if (errorMsg.includes("unique set")) {
          errorMsg = "Attendance already recorded for this class and subject today. You cannot submit twice.";
        }
      } else if (errorData?.non_field_errors) {
        errorMsg = errorData.non_field_errors[0];
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      }
      
      alert(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const setStatus = (studentId, status) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedStudents.size === 0) {
      aler"Please select students and an action";
      return;
    }
    
    const newStatusMap = { ...statusMap };
    selectedStudents.forEach(studentId => {
      newStatusMap[studentId] = bulkAction;
    });
    setStatusMap(newStatusMap);
    setSelectedStudents(new Set());
    setBulkAction('');
  };

  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.student_id)));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header with shortcuts hint */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Record Attendance</h1>
        <button
          onClick={() => setShowShortcutsHelp(true)}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
        >
          <span>⌨️</span>
          <span>Shortcuts (Ctrl+?)</span>
        </button>
      </div>

      {/* Quick Actions Bar */}
      {students.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white rounded text-xs">P</kbd>
              <span>Mark Present</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white rounded text-xs">L</kbd>
              <span>Mark Late</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white rounded text-xs">X</kbd>
              <span>Mark Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+Enter</kbd>
              <span>Submit</span>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Select */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-gray-700">
          Select Classroom
        </label>
        <select
          className="p-3 border rounded-lg w-full bg-white"
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
        >
          <option value="">-- Select Classroom --</option>
          {classrooms.map((cls) => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Select */}
      {selectedClassroom && (
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-gray-700">
            Select Subject
          </label>
          <select
            className="p-3 border rounded-lg w-full bg-white"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((subjectId) => (
              <option key={subjectId} value={subjectId}>
                {subjectMap[subjectId] || `Subject ${subjectId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Students Table with Keyboard Navigation */}
      {selectedClassroom && selectedSubject && (
        <div className="bg-white shadow-md rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Students</h2>
            
            {/* Bulk Actions */}
            <div className="flex gap-2 items-center">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="p-2 border rounded-lg text-sm"
              >
                <option value="">Bulk Action</option>
                <option value="present">Mark Present</option>
                <option value="absent">Mark Absent</option>
                <option value="late">Mark Late</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={selectedStudents.size === 0 || !bulkAction}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                Apply ({selectedStudents.size})
              </button>
            </div>
          </div>

          <ResponsiveTable
            data={students}
            selectable={true}
            selectedItems={selectedStudents}
            onSelectionChange={setSelectedStudents}
            columns={[
              {
                key: 'full_name',
                label: 'Student Name',
                sortable: true,
                render: (student, index) => (
                  <div className={`p-2 rounded ${
                    index === focusedStudentIndex ? 'bg-blue-100 border-2 border-blue-400' : ''
                  }`}>
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-sm text-gray-500">ID: {student.admission_number}</div>
                  </div>
                )
              },
              {
                key: 'present',
                label: 'Present',
                render: (student) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "present");
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "present"
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    ✓ Present
                  </button>
                )
              },
              {
                key: 'late',
                label: 'Late',
                render: (student) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "late");
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "late"
                        ? "bg-yellow-500 text-white"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    ⏰ Late
                  </button>
                )
              },
              {
                key: 'absent',
                label: 'Absent',
                render: (student) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "absent");
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "absent"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    ✗ Absent
                  </button>
                )
              }
            ]}
            mobileCardRenderer={(student, index) => (
              <div className={`space-y-3 ${
                index === focusedStudentIndex ? 'ring-2 ring-blue-400 bg-blue-50' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusMap[student.student_id] === 'present' ? 'bg-green-100 text-green-700' :
                    statusMap[student.student_id] === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    statusMap[student.student_id] === 'absent' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusMap[student.student_id] || 'Not marked'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "present");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "present"
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    ✓ Present
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "late");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "late"
                        ? "bg-yellow-500 text-white"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    ⏰ Late
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(student.student_id, "absent");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      statusMap[student.student_id] === "absent"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    ✗ Absent
                  </button>
                </div>
              </div>
            )}
          />

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Marked: {Object.keys(statusMap).length}/{students.length} students
              {students.length > 0 && (
                <span className="ml-4">
                  Focused: {students[focusedStudentIndex]?.full_name} ({focusedStudentIndex + 1}/{students.length})
                </span>
              )}
            </div>
            <button
              onClick={handleSubmitClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Submit Attendance (Ctrl+Enter)
            </button>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={submitAttendance}
        title="Confirm Attendance Submission"
        message={`You are about to submit attendance for ${Object.keys(statusMap).length} students. This action cannot be undone. Are you sure?`}
        confirmText="Submit Attendance"
        type="warning"
      />

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={TEACHER_SHORTCUTS}
      />
    </div>
  );
}