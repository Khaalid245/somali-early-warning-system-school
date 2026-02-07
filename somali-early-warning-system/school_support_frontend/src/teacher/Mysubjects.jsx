import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";

export default function MySubjects() {
  const { user } = useContext(AuthContext);

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});

  // ------------------------
  // Load Classrooms
  // ------------------------
  const loadClassrooms = async () => {
    try {
      const res = await api.get("/classrooms/");
      setClassrooms(res.data);
    } catch (err) {
      console.error("Failed to load classrooms", err);
    }
  };

  // ------------------------
  // Load Subjects
  // ------------------------
  const loadSubjects = async () => {
    try {
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  };

  // ------------------------
  // Load Assignments (Teacher Only)
  // ------------------------
  const loadAssignments = async () => {
    try {
      const res = await api.get("/assignments/");
      const myAssignments = res.data.filter((a) => a.teacher === user.user_id);
      setAssignments(myAssignments);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  // ------------------------
  // Load Students Count Per Class
  // ------------------------
  const loadStudentsForClasses = async (classrooms) => {
    try {
      const map = {};
      for (const classId of classrooms) {
        const res = await api.get(`/students/?classroom=${classId}`);
        map[classId] = res.data.length;
      }
      setStudentsMap(map);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  // Initial load
  useEffect(() => {
    loadClassrooms();
    loadSubjects();
    loadAssignments();
  }, []);

  // Load student count after assignments arrive
  useEffect(() => {
    if (assignments.length > 0) {
      const classIds = [...new Set(assignments.map((a) => a.classroom))];
      loadStudentsForClasses(classIds);
    }
  }, [assignments]);

  // Helper
  const getClassName = (id) =>
    classrooms.find((c) => c.class_id == id)?.name || `Class ${id}`;

  const getSubjectName = (id) =>
    subjects.find((s) => s.subject_id == id)?.name || `Subject ${id}`;

  // Group by subject
  const groupedBySubject = assignments.reduce((acc, assignment) => {
    const subjectId = assignment.subject;
    if (!acc[subjectId]) acc[subjectId] = [];
    acc[subjectId].push(assignment);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-64 bg-white border-r p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6">SEWS Dashboard</h2>

        <nav className="space-y-4">
          <a href="/teacher" className="block text-gray-700">
            Dashboard
          </a>

          <a href="/teacher/attendance" className="block text-gray-700">
            Record Attendance
          </a>

          <a href="/teacher/classes" className="block text-gray-700">
            My Classes
          </a>

          <a
            href="/teacher/subjects"
            className="block px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold"
          >
            My Subjects
          </a>
        </nav>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 p-10">
        <h1 className="text-2xl font-bold mb-1">My Subjects</h1>
        <p className="text-gray-500 mb-6">
          These are the subjects assigned to you across all classrooms.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(groupedBySubject).map((subjectId) => {
            const subjectName = getSubjectName(subjectId);
            const subjectClasses = groupedBySubject[subjectId];

            return (
              <div
                key={subjectId}
                className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition"
              >
                {/* Subject Icon Row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    📚
                  </div>

                  <h3 className="text-xl font-semibold">{subjectName}</h3>
                </div>

                {/* Classes for this subject */}
                <div className="space-y-4">
                  {subjectClasses.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      className="flex justify-between items-center border-b pb-3"
                    >
                      <div>
                        <p className="font-medium">
                          {getClassName(assignment.classroom)}
                        </p>

                        <p className="text-sm text-gray-500">
                          {studentsMap[assignment.classroom] || 0} students
                        </p>
                      </div>

                      <a
                        href="/teacher/attendance"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        → Record
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
