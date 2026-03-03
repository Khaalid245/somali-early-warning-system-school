import { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import ConfirmDialog from "../components/ConfirmDialog";
import ResponsiveTable from "../components/ResponsiveTable";

export default function AttendancePage() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

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

  // --------------------------
  // LOAD TEACHER ASSIGNMENTS + REAL CLASSROOMS
  // --------------------------
  const loadAssignments = async () => {
    try {
      const res = await api.get("/academics/assignments/");
      const myAssignments = res.data.filter((a) => a.teacher === user.user_id);

      setAssignments(myAssignments);

      // Get only the classroom IDs the teacher teaches
      const classIds = [...new Set(myAssignments.map((a) => a.classroom))];

      // Fetch all classrooms
      const classRes = await api.get("/students/classrooms/");

      // Keep only classrooms assigned to this teacher
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

  // --------------------------
  // LOAD STUDENTS IN SELECTED CLASS
  // --------------------------
  const loadStudents = async (classroomId) => {
    try {
      const res = await api.get(`/students/?classroom=${classroomId}`);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  // --------------------------
  // LOAD SUBJECTS ASSIGNED FOR THIS CLASS
  // --------------------------
  const updateSubjects = (classroomId) => {
    const filtered = assignments
      .filter((a) => a.classroom === classroomId)
      .map((a) => a.subject);

    setSubjects(filtered);
  };

  // INITIAL LOAD
  useEffect(() => {
    loadAssignments();
  }, []);

  // PRE-SELECT FROM DASHBOARD
  useEffect(() => {
    if (location.state?.classroom && classrooms.length > 0) {
      const cls = classrooms.find(c => c.name === location.state.classroom);
      if (cls) setSelectedClassroom(cls.class_id.toString());
    }
  }, [location.state, classrooms]);

  // WHEN CLASS CHANGES
  useEffect(() => {
    if (selectedClassroom) {
      const id = parseInt(selectedClassroom);

      loadStudents(id);
      updateSubjects(id);
      setSelectedSubject("");
      setStatusMap({});
    }
  }, [selectedClassroom]);

  // --------------------------
  // SUBMIT ATTENDANCE WITH CONFIRMATION
  // --------------------------
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
      <h1 className="text-2xl font-bold mb-6">Record Attendance</h1>

      {/* CLASSROOM SELECT */}
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

      {/* SUBJECT SELECT */}
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

      {/* STUDENTS TABLE */}
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

          {/* STUDENTS TABLE - RESPONSIVE */}
          <ResponsiveTable
            data={students}
            selectable={true}
            selectedItems={selectedStudents}
            onSelectionChange={setSelectedStudents}
            columns={[
              {
                key: 'full_name',
                label: 'Student Name',
                sortable: true
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
            mobileCardRenderer={(student) => (
              <div className="space-y-3">
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
            </div>
            <button
              onClick={handleSubmitClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Submit Attendance
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
    </div>
  );
}