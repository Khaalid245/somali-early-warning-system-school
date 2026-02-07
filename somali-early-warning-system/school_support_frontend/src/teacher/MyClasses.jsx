import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";

export default function MyClasses() {
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
  // Load Teacher Assignments
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
  // Load Students Count per Class
  // ------------------------
  const loadStudentsForClasses = async (classrooms) => {
    try {
      const map = {};
      for (const c of classrooms) {
        const res = await api.get(`/students/?classroom=${c}`);
        map[c] = res.data.length;
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

  // Load student count after classes load
  useEffect(() => {
    if (assignments.length > 0) {
      const classIds = [...new Set(assignments.map((a) => a.classroom))];
      loadStudentsForClasses(classIds);
    }
  }, [assignments]);

  // Helper: classroom name
  const getClassName = (id) =>
    classrooms.find((c) => c.class_id == id)?.name || `Class ${id}`;

  // Helper: subject name
  const getSubjectName = (id) =>
    subjects.find((s) => s.subject_id == id)?.name || `Subject ${id}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --------------- Sidebar --------------- */}
      <aside className="w-64 bg-white border-r p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6">SEWS Dashboard</h2>

        <nav className="space-y-4">
          <a href="/teacher" className="block text-gray-700">
            Dashboard
          </a>
          <a href="/teacher/attendance" className="block text-gray-700">
            Record Attendance
          </a>

          <a
            href="/teacher/classes"
            className="block px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold"
          >
            My Classes
          </a>

          <a href="/teacher/subjects" className="block text-gray-700">
            My Subjects
          </a>
        </nav>
      </aside>

      {/* --------------- MAIN CONTENT --------------- */}
      <main className="flex-1 p-10">
        <h1 className="text-2xl font-bold mb-1">My Classes</h1>
        <p className="text-gray-500 mb-6">
          Here are all classrooms and subjects assigned to you.
        </p>

        {/* Class List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => (
            <div
              key={a.assignment_id}
              className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition"
            >
              {/* Icon + Class Name Row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  📘
                </div>

                <div>
                  <h3 className="text-lg font-semibold">
                    {getClassName(a.classroom)}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {studentsMap[a.classroom] || 0} students
                  </p>
                </div>
              </div>

              {/* Subject Badge */}
              <div className="mt-2">
                <span className="inline-block px-4 py-1 bg-blue-600 text-white rounded-full text-sm">
                  {getSubjectName(a.subject)}
                </span>
              </div>

              {/* Action */}
              <div className="mt-5">
                <a
                  href="/teacher/attendance"
                  className="text-blue-600 font-medium hover:underline"
                >
                  → Record Attendance
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
