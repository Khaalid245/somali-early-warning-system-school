import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { showToast } from "../utils/toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AttendancePage() {
  const { user, logout } = useContext(AuthContext);
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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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

  const loadAssignments = async () => {
    try {
      const res = await api.get("/academics/assignments/");
      // Backend returns paginated data with 'results' array
      const assignments = Array.isArray(res.data.results) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setAssignments(assignments);

      if (assignments.length === 0) {
        showToast.error("No classes assigned to you");
        return;
      }

      const classIds = [...new Set(assignments.map((a) => a.classroom))];
      const classRes = await api.get("/students/classrooms/");
      const allClassrooms = classRes.data.results || classRes.data || [];
      const filteredClasses = allClassrooms.filter((cls) => classIds.includes(cls.class_id));
      setClassrooms(filteredClasses);

      const subjectRes = await api.get("/academics/subjects/");
      const allSubjects = subjectRes.data.results || subjectRes.data || [];
      const subjectMapping = {};
      allSubjects.forEach(sub => {
        subjectMapping[sub.subject_id] = sub.name;
      });
      setSubjectMap(subjectMapping);
    } catch (err) {
      console.error("Failed to load assignments", err);
      showToast.error("Failed to load assignments");
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

  const submitAttendance = async () => {
    if (!selectedSubject) {
      showToast.error("Please select a subject first!");
      return;
    }

    if (Object.keys(statusMap).length !== students.length) {
      showToast.error(`Please mark attendance for all ${students.length} students.`);
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
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

      showToast.success("Attendance saved successfully!");
      setStatusMap({});
      navigate("/teacher");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Error submitting attendance";
      
      if (errorData?.error && Array.isArray(errorData.error)) {
        errorMsg = errorData.error[0];
        if (errorMsg.includes("unique set")) {
          errorMsg = "Attendance already recorded for this class and subject today.";
        }
      }
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const newMap = {};
    students.forEach(stu => {
      newMap[stu.student_id] = status;
    });
    setStatusMap(newMap);
  };

  const filteredStudents = students.filter(stu =>
    stu.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCount = (status) => {
    return Object.values(statusMap).filter(s => s === status).length;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Record Attendance</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Classroom Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📚 Select Classroom
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
              >
                <option value="">-- Choose Classroom --</option>
                {classrooms.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📖 Select Subject
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base disabled:bg-gray-100"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClassroom}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((subjectId) => (
                  <option key={subjectId} value={subjectId}>
                    {subjectMap[subjectId] || `Subject ${subjectId}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => markAll("present")}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-xs sm:text-sm font-medium"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => markAll("absent")}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-xs sm:text-sm font-medium"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="🔍 Search student by name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Students Grid */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Student Name</th>
                        <th className="text-center px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.map((stu) => (
                        <tr key={stu.student_id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm sm:text-base flex-shrink-0">
                                {stu.full_name.charAt(0)}
                              </div>
                              <span className="text-sm sm:text-base font-medium text-gray-800">{stu.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => setStatus(stu.student_id, "present")}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium ${
                                  statusMap[stu.student_id] === "present"
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => setStatus(stu.student_id, "late")}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium ${
                                  statusMap[stu.student_id] === "late"
                                    ? "bg-yellow-500 text-white shadow-md"
                                    : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                }`}
                              >
                                ⏰ Late
                              </button>
                              <button
                                onClick={() => setStatus(stu.student_id, "absent")}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium ${
                                  statusMap[stu.student_id] === "absent"
                                    ? "bg-red-600 text-white shadow-md"
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                ✗ Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Students: <strong>{students.length}</strong> | Marked: <strong>{Object.keys(statusMap).length}</strong>
                  </p>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigate("/teacher")}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm sm:text-base font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitAttendance}
                      disabled={loading}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Submitting..." : "✓ Submit Attendance"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {selectedClassroom && selectedSubject && students.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-sm sm:text-base">No students found in this classroom.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Submit Attendance"
        message={`Are you sure you want to submit attendance for ${students.length} students?`}
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirm(false)}
        confirmText="Submit"
        type="info"
      />
    </div>
  );
}
