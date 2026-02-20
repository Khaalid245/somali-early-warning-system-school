import { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";

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
  // SUBMIT ATTENDANCE
  // --------------------------
  const submitAttendance = async () => {
    if (!selectedSubject) {
      alert("Select a subject first!");
      return;
    }

    if (Object.keys(statusMap).length !== students.length) {
      alert(`Please mark attendance for all ${students.length} students. Currently marked: ${Object.keys(statusMap).length}`);
      return;
    }

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

      alert("Attendance saved successfully!");
      setStatusMap({});
    } catch (err) {
      console.error("Submit Error:", err.response?.data || err);
      console.log("Full error:", JSON.stringify(err.response?.data, null, 2));
      
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
    }
  };

  const setStatus = (studentId, status) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
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
          <h2 className="text-xl font-semibold mb-4">Students</h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Name</th>
                <th className="p-3 border text-center">Present</th>
                <th className="p-3 border text-center">Late</th>
                <th className="p-3 border text-center">Absent</th>
              </tr>
            </thead>

            <tbody>
              {students.map((stu) => (
                <tr key={stu.student_id} className="border-b">
                  <td className="p-3 border">{stu.full_name}</td>

                  <td className="p-3 border text-center">
                    <button
                      onClick={() => setStatus(stu.student_id, "present")}
                      className={`px-3 py-1 rounded-lg ${
                        statusMap[stu.student_id] === "present"
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Present
                    </button>
                  </td>

                  <td className="p-3 border text-center">
                    <button
                      onClick={() => setStatus(stu.student_id, "late")}
                      className={`px-3 py-1 rounded-lg ${
                        statusMap[stu.student_id] === "late"
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      Late
                    </button>
                  </td>

                  <td className="p-3 border text-center">
                    <button
                      onClick={() => setStatus(stu.student_id, "absent")}
                      className={`px-3 py-1 rounded-lg ${
                        statusMap[stu.student_id] === "absent"
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 text-right">
            <button
              onClick={submitAttendance}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Submit Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
