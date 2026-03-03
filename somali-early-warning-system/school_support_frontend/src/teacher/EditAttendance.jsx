import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { showToast } from "../utils/toast";

export default function EditAttendance() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await api.get("/attendance/tracking/classes/");
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const loadSessionsForClass = async (classId) => {
    setSelectedClass(classId);
    setSelectedSession(null);
    try {
      const res = await api.get("/attendance/sessions/");
      const allSessions = res.data.results || res.data || [];
      const classSessions = allSessions.filter(s => s.classroom === classId).slice(0, 10);
      setSessions(classSessions);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}/`);
      setSelectedSession(res.data);
      
      // Fetch full records with student details
      const recordsWithDetails = await Promise.all(
        (res.data.records || []).map(async (record) => {
          try {
            const studentRes = await api.get(`/students/${record.student}/`);
            return {
              ...record,
              student_name: studentRes.data.full_name,
              student_obj: studentRes.data
            };
          } catch {
            return { ...record, student_name: `Student ${record.student}`, student_obj: null };
          }
        })
      );
      
      setRecords(recordsWithDetails);
      
      const statusMapping = {};
      const remarksMapping = {};
      recordsWithDetails.forEach(record => {
        statusMapping[record.student] = record.status;
        remarksMapping[record.student] = record.remarks || '';
      });
      setStatusMap(statusMapping);
      setRemarksMap(remarksMapping);
    } catch (err) {
      console.error("Failed to load session details", err);
      showToast.error("Failed to load session details");
    }
  };

  const updateAttendance = async () => {
    if (!selectedSession) return;

    setLoading(true);
    const updatedRecords = records.map(record => ({
      student: record.student,
      status: statusMap[record.student] || record.status,
      remarks: remarksMap[record.student] || record.remarks || ''
    }));

    try {
      await api.patch(`/attendance/sessions/${selectedSession.session_id}/`, {
        records: updatedRecords
      });
      showToast.success("Attendance updated successfully!");
      navigate("/teacher");
    } catch (err) {
      console.error("Failed to update attendance", err);
      showToast.error(err.response?.data?.error || "Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 overflow-auto">
        <Navbar user={user} dashboardData={{}} />

        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">✏️ Edit Attendance</h1>
            <p className="text-gray-600 mt-1">Select class, then choose session to edit</p>
          </div>

          {/* Class Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Select Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <button
                  key={cls.class_id}
                  onClick={() => loadSessionsForClass(cls.class_id)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedClass === cls.class_id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-bold text-gray-800">{cls.class_name}</p>
                  <p className="text-sm text-gray-600">{cls.subject}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Session Selection */}
          {selectedClass && sessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Step 2: Select Session to Edit</h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <button
                  key={session.session_id}
                  onClick={() => loadSessionDetails(session.session_id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    selectedSession?.session_id === session.session_id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{session.classroom_name} - {session.subject_name}</p>
                      <p className="text-sm text-gray-600">{session.attendance_date}</p>
                    </div>
                    <span className="text-sm text-gray-500">{session.records?.length || 0} students</span>
                  </div>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* Edit Records */}
          {selectedSession && records.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Student Attendance</h2>
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.student} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-800">{record.student_name}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(record.student, "present")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            statusMap[record.student] === "present"
                              ? "bg-green-600 text-white"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          ✓ Present
                        </button>
                        <button
                          onClick={() => setStatus(record.student, "late")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            statusMap[record.student] === "late"
                              ? "bg-yellow-500 text-white"
                              : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          }`}
                        >
                          ⏰ Late
                        </button>
                        <button
                          onClick={() => setStatus(record.student, "absent")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            statusMap[record.student] === "absent"
                              ? "bg-red-600 text-white"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          ✗ Absent
                        </button>
                        <button
                          onClick={() => setStatus(record.student, "excused")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            statusMap[record.student] === "excused"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          📝 Excused
                        </button>
                      </div>
                    </div>
                    {statusMap[record.student] === "excused" && (
                      <input
                        type="text"
                        placeholder="Reason for excuse..."
                        value={remarksMap[record.student] || ''}
                        onChange={(e) => setRemarksMap(prev => ({ ...prev, [record.student]: e.target.value }))}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => navigate("/teacher")}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={updateAttendance}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                >
                  {loading ? "Updating..." : "✓ Update Attendance"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
