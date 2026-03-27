import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { BookOpen, BookMarked, Users, CheckCircle, BarChart3, GraduationCap } from 'lucide-react';

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
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4" style={{ borderColor: '#16A34A' }}></div>
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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-green-600" />
              My Classes
            </h1>
            <p className="text-sm text-gray-600 mt-1">All the classes you teach</p>
          </div>

          {/* Summary Cards */}
          {assignments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-gray-800">{[...new Set(assignments.map(a => a.classroom))].length}</p>
                    <p className="text-sm text-gray-600">Total Classes</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Different classrooms</p>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-gray-800">{[...new Set(assignments.map(a => a.subject))].length}</p>
                    <p className="text-sm text-gray-600">Total Subjects</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Different subjects</p>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-gray-800">{Object.values(studentsMap).reduce((a, b) => a + b, 0)}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Across all classes</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {assignments.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Classes Yet</h3>
              <p className="text-sm text-gray-600">Contact your administrator to get classes assigned</p>
            </div>
          )}

          {/* Class Cards */}
          {assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  className="bg-white rounded-lg border border-gray-200 transition-all overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#BBF7D0';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Header */}
                  <div className="p-5 bg-white" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <BookMarked className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-800 truncate">{getClassName(a.classroom)}</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {studentsMap[a.classroom] || 0} Students
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Subject */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Subject</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
                        {getSubjectName(a.subject)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mb-5">
                      <p className="text-xs text-gray-500 mb-2">Status</p>
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: a.is_active ? '#F0FDF4' : '#F3F4F6',
                          color: a.is_active ? '#16A34A' : '#6B7280',
                          borderColor: a.is_active ? '#BBF7D0' : '#E5E7EB'
                        }}
                      >
                        {a.is_active ? <CheckCircle className="w-3 h-3" /> : null}
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2.5">
                      <button
                        onClick={() => navigate('/teacher/attendance', { 
                          state: { 
                            classroom: getClassName(a.classroom),
                            subject: getSubjectName(a.subject)
                          } 
                        })}
                        className="w-full px-4 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Take Attendance
                      </button>
                      <button
                        onClick={() => navigate('/teacher/attendance-tracking')}
                        className="w-full px-4 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        style={{ backgroundColor: 'transparent', color: '#374151', border: '1px solid #E5E7EB' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#16A34A';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Records
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
