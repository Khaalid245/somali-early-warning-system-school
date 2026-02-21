import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/apiClient";

export default function StudentAttendanceReport() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [studentId]);

  const loadReport = async () => {
    try {
      const res = await api.get(`/attendance/student-report/${studentId}/`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading report...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load report</div>;

  const attendanceStatus = data.attendance_rate >= 90 ? 'Excellent' : 
                          data.attendance_rate >= 75 ? 'Good' : 
                          data.attendance_rate >= 60 ? 'Needs Improvement' : 'Critical';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="border-b-2 border-gray-200 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
              <p className="text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden"
            >
              🖨️ Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Student Info</h2>
            <div className="mt-3 space-y-2">
              <p className="text-lg"><span className="font-semibold">Name:</span> {data.student_name}</p>
              <p className="text-lg"><span className="font-semibold">ID:</span> {data.student_id}</p>
              <p className="text-lg"><span className="font-semibold">Class:</span> {data.classroom}</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Period</h2>
            <div className="mt-3 space-y-2">
              <p className="text-lg"><span className="font-semibold">From:</span> {data.period_start}</p>
              <p className="text-lg"><span className="font-semibold">To:</span> {data.period_end}</p>
              <p className="text-lg"><span className="font-semibold">Days:</span> {data.total_days}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{data.present_count}</div>
            <div className="text-sm text-green-600">Present</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700">{data.absent_count}</div>
            <div className="text-sm text-red-600">Absent</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700">{data.late_count}</div>
            <div className="text-sm text-yellow-600">Late</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">{data.attendance_rate}%</div>
            <div className="text-sm text-blue-600">Rate</div>
          </div>
        </div>

        <div className={`p-6 rounded-lg mb-8 ${
          attendanceStatus === 'Excellent' ? 'bg-green-50 border-l-4 border-green-500' :
          attendanceStatus === 'Good' ? 'bg-blue-50 border-l-4 border-blue-500' :
          attendanceStatus === 'Needs Improvement' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
          'bg-red-50 border-l-4 border-red-500'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Status: {attendanceStatus}</h3>
          <p className="text-gray-700">
            {attendanceStatus === 'Excellent' && 'Student attending regularly. Excellent!'}
            {attendanceStatus === 'Good' && 'Good attendance. Keep it up!'}
            {attendanceStatus === 'Needs Improvement' && 'Attendance needs improvement.'}
            {attendanceStatus === 'Critical' && '⚠️ Critical: Too many absences. Action required.'}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Attendance</h2>
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b">Subject</th>
                <th className="px-4 py-3 text-center text-sm font-semibold border-b">Present</th>
                <th className="px-4 py-3 text-center text-sm font-semibold border-b">Absent</th>
                <th className="px-4 py-3 text-center text-sm font-semibold border-b">Late</th>
                <th className="px-4 py-3 text-center text-sm font-semibold border-b">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.subject_breakdown?.map((subj, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-3 text-sm">{subj.subject_name}</td>
                  <td className="px-4 py-3 text-center text-sm text-green-600">{subj.present}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-600">{subj.absent}</td>
                  <td className="px-4 py-3 text-center text-sm text-yellow-600">{subj.late}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold">{subj.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t-2 border-gray-200 pt-6 mt-8 text-center text-gray-600">
          <p>School Early Warning System - Attendance Report</p>
          <p className="text-sm mt-2">Contact your Form Master for questions</p>
        </div>
      </div>
    </div>
  );
}
