import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { CardSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";

export default function MyClasses() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);

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

      // Backend returns paginated data with 'results' array
      const assignments = assignmentsRes.data.results || assignmentsRes.data || [];
      setAssignments(assignments);
      setClassrooms(classroomsRes.data.results || classroomsRes.data || []);
      setSubjects(subjectsRes.data.results || subjectsRes.data || []);

      // Load student counts
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Classes</h1>
            <p className="text-gray-600">Manage your assigned classrooms and subjects</p>
          </div>

          {/* Stats Cards */}
          {!loading && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Classes</p>
                    <p className="text-3xl font-bold text-gray-900">{[...new Set(assignments.map(a => a.classroom))].length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                    <span className="text-2xl">📖</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Subjects</p>
                    <p className="text-3xl font-bold text-gray-900">{[...new Set(assignments.map(a => a.subject))].length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{Object.values(studentsMap).reduce((a, b) => a + b, 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!loading && assignments.length === 0 && (
            <EmptyState
              icon="📚"
              title="No Classes Assigned"
              message="You don't have any classes assigned yet. Contact your administrator to get started."
            />
          )}

          {/* Class Cards */}
          {!loading && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                        <span className="text-2xl">📘</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{getClassName(a.classroom)}</h3>
                        <p className="text-blue-100 text-sm">{studentsMap[a.classroom] || 0} students</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Subject */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Subject</p>
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                        {getSubjectName(a.subject)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        a.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/teacher/attendance', { 
                          state: { 
                            classroom: getClassName(a.classroom),
                            subject: getSubjectName(a.subject)
                          } 
                        })}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        ✓ Take Attendance
                      </button>
                      <button
                        onClick={() => navigate('/teacher', { state: { tab: 'students' } })}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                      >
                        👥
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
