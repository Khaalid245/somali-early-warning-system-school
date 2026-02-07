import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);

  const [assignments, setAssignments] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Load Classrooms
  const loadClassrooms = async () => {
    try {
      const res = await api.get("/classrooms/");
      setClassrooms(res.data);
    } catch (err) {
      console.error("Failed to load classrooms", err);
    }
  };

  // Load Subjects
  const loadSubjects = async () => {
    try {
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  };

  // Load Assignments
  const loadAssignments = async () => {
    try {
      const res = await api.get("/assignments/");
      const myAssignments = res.data.filter((a) => a.teacher === user.user_id);
      setAssignments(myAssignments);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  // Load Students Count
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

  // Load Attendance Today
  const loadTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get(`/attendance/?date=${today}`);
      setAttendanceToday(res.data);
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  };

  // Initial Load
  useEffect(() => {
    loadClassrooms();
    loadSubjects();
    loadAssignments();
    loadTodayAttendance();
  }, []);

  useEffect(() => {
    if (assignments.length > 0) {
      const classIds = [...new Set(assignments.map((a) => a.classroom))];
      loadStudentsForClasses(classIds);
    }
  }, [assignments]);

  // Helpers
  const getClassName = (id) =>
    classrooms.find((c) => c.class_id == id)?.name || `Class ${id}`;

  const getSubjectName = (id) =>
    subjects.find((s) => s.subject_id == id)?.name || `Subject ${id}`;

  const totalClasses = assignments.length;

  const completedToday = new Set(
    attendanceToday.map((a) => `${a.student}-${a.subject}`),
  ).size;

  const recentActivity = [...attendanceToday].reverse().slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-full lg:w-64 bg-white border-r p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6">SEWS Dashboard</h2>

        <nav className="space-y-4">
          <a href="/teacher" className="block font-semibold text-blue-600">
            Dashboard
          </a>

          <a
            href="/teacher/attendance"
            className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
          >
            Record Attendance
          </a>

          <a
            href="/teacher/classes"
            className="block text-gray-700 hover:text-blue-600"
          >
            My Classes
          </a>

          <a
            href="/teacher/subjects"
            className="block text-gray-700 hover:text-blue-600"
          >
            My Subjects
          </a>
        </nav>

        <button
          onClick={logout}
          className="mt-10 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.name || "Teacher"}
        </h1>
        <p className="text-gray-500 mb-8">
          Here’s your teaching overview for today
        </p>

        {/* ---------------- Summary Cards ---------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Attendance Today */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Today’s Attendance</p>
            <h2 className="text-3xl font-bold">
              {completedToday}/{totalClasses} Classes
            </h2>
            <p className="text-green-600 mt-2 font-medium">
              ✓ {completedToday} completed
            </p>
          </div>

          {/* Classes Assigned */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Classes Assigned</p>
            <h2 className="text-3xl font-bold">{totalClasses}</h2>
            <p className="text-gray-600 mt-2 text-sm">
              {assignments.map((a) => getClassName(a.classroom)).join(", ")}
            </p>
          </div>

          {/* Subjects */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Subjects Taught</p>
            <h2 className="text-3xl font-bold">
              {[...new Set(assignments.map((a) => a.subject))].length}
            </h2>
          </div>
        </div>

        {/* ---------------- My Classes ---------------- */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">My Classes</h2>

          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {assignments.map((a) => (
              <div
                key={a.assignment_id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4"
              >
                <div>
                  <p className="font-bold text-lg">
                    {getClassName(a.classroom)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {getSubjectName(a.subject)}
                  </p>
                </div>

                <span className="text-gray-700 mt-2 sm:mt-0">
                  {studentsMap[a.classroom] || 0} students
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Recent Activity ---------------- */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            {recentActivity.length === 0 && (
              <p className="text-gray-500">No attendance recorded yet.</p>
            )}

            {recentActivity.map((a, index) => (
              <div key={index} className="py-3 border-b last:border-none">
                <p className="font-medium text-gray-800">
                  Student #{a.student} — {a.status.toUpperCase()}
                </p>
                <p className="text-gray-500 text-sm">
                  {new Date(a.attendance_date).toDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
