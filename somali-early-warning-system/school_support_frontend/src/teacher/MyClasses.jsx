import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MyClasses() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, classroomsRes, subjectsRes] = await Promise.all([
        api.get("/academics/assignments/"),
        api.get("/students/classrooms/"),
        api.get("/academics/subjects/")
      ]);

      const assignments = assignmentsRes.data.results || assignmentsRes.data || [];
      setAssignments(assignments);
      setClassrooms(classroomsRes.data.results || classroomsRes.data || []);
      setSubjects(subjectsRes.data.results || subjectsRes.data || []);

      if (assignments.length > 0) {
        const classIds = [...new Set(assignments.map((a) => a.classroom))];
        const map = {};
        for (const id of classIds) {
          const res = await api.get(`/students/?classroom=${id}`);
          const studentsList = res.data.results || res.data || [];
          map[id] = studentsList.length;
        }
        setStudentsMap(map);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (id) => classrooms.find((c) => c.class_id == id)?.name || `Class ${id}`;
  const getSubjectName = (id) => subjects.find((s) => s.subject_id == id)?.name || `Subject ${id}`;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />
          <div className="p-4 sm:p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">Loading your classes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} searchQuery="" onSearchChange={() => {}} />

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>📚</span> My Classes
            </h1>
            <p className="text-sm sm:text-base text-gray-600">All the classes you teach</p>
          </div>

          {/* Summary Cards */}
          {assignments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl sm:text-4xl">📘</span>
                  <p className="text-3xl sm:text-4xl font-bold">{[...new Set(assignments.map(a => a.classroom))].length}</p>
                </div>
                <p className="text-sm sm:text-base font-semibold">Total Classes</p>
                <p className="text-xs text-blue-100 mt-1">Different classrooms</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl sm:text-4xl">📖</span>
                  <p className="text-3xl sm:text-4xl font-bold">{[...new Set(assignments.map(a => a.subject))].length}</p>
                </div>
                <p className="text-sm sm:text-base font-semibold">Total Subjects</p>
                <p className="text-xs text-purple-100 mt-1">Different subjects</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl sm:text-4xl">👥</span>
                  <p className="text-3xl sm:text-4xl font-bold">{Object.values(studentsMap).reduce((a, b) => a + b, 0)}</p>
                </div>
                <p className="text-sm sm:text-base font-semibold">Total Students</p>
                <p className="text-xs text-green-100 mt-1">Across all classes</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {assignments.length === 0 && (
            <div className="bg-white rounded-xl p-8 sm:p-12 text-center border-2 border-gray-200">
              <p className="text-5xl sm:text-6xl mb-4">📚</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Classes Yet</h3>
              <p className="text-sm sm:text-base text-gray-600">Contact your administrator to get classes assigned</p>
            </div>
          )}

          {/* Class Cards */}
          {assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl sm:text-4xl">📘</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold truncate">{getClassName(a.classroom)}</h3>
                        <p className="text-xs sm:text-sm text-blue-100">{studentsMap[a.classroom] || 0} students</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-6">
                    {/* Subject */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Subject</p>
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {getSubjectName(a.subject)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        a.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {a.is_active ? "✓ Active" : "✗ Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/teacher/attendance', { 
                          state: { 
                            classroom: getClassName(a.classroom),
                            subject: getSubjectName(a.subject)
                          } 
                        })}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <span>📝</span> Take Attendance
                      </button>
                      <button
                        onClick={() => navigate('/teacher/attendance-tracking')}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <span>📊</span> View Records
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
