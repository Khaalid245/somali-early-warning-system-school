import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

export default function AttendanceDrillDown() {
  const [classrooms, setClassrooms] = useState([]);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMissing, setShowMissing] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [drillRes, compRes] = await Promise.all([
        api.get('/dashboard/admin/attendance/drill-down/'),
        api.get('/dashboard/admin/attendance/daily-completion/'),
      ]);
      setClassrooms(drillRes.data.classrooms);
      setHighRiskCount(drillRes.data.high_risk_count);
      setCompletion(compRes.data);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
      showToast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAbsenceColor = (rate) => {
    if (rate > 25) return 'text-red-600 bg-red-50';
    if (rate > 20) return 'text-orange-600 bg-orange-50';
    if (rate > 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const pct = completion?.completion_pct ?? 0;
  const barColor = pct === 100 ? 'bg-green-600' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">

      {/* ── Today's Completion Monitor ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Today's Attendance Completion</h2>
            <span className="text-sm text-gray-500">{completion?.date}</span>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <p className="text-2xl font-bold text-gray-900">{completion?.total_assignments ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total Assignments</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{completion?.submitted_count ?? 0}</p>
            <p className="text-xs text-green-600 mt-1">Submitted</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-600">{completion?.missing_count ?? 0}</p>
            <p className="text-xs text-red-500 mt-1">Missing</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Completion</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${barColor} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Toggle missing / submitted */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowMissing(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              showMissing
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Missing ({completion?.missing_count ?? 0})
          </button>
          <button
            onClick={() => setShowMissing(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              !showMissing
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Submitted ({completion?.submitted_count ?? 0})
          </button>
        </div>

        {/* List */}
        {showMissing ? (
          completion?.missing?.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {completion.missing.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-red-50">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{item.teacher_name}</span>
                    <span className="text-gray-400 text-xs ml-2">{item.teacher_email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">{item.classroom}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600">{item.subject}</span>
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-green-600 font-medium">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              All attendance recorded for today.
            </div>
          )
        ) : (
          completion?.submitted?.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {completion.submitted.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-green-50">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{item.teacher_name}</span>
                    <span className="text-gray-400 text-xs ml-2">{item.teacher_email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">{item.classroom}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600">{item.subject}</span>
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No attendance submitted yet today.</div>
          )
        )}
      </div>

      {/* ── Classroom Absence Rate Table (existing) ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Classroom Absence Rates (Last 30 Days)</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-600">
              {highRiskCount} High-Risk Classroom{highRiskCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Classroom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Form Master</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Students</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Absence Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Absent Days</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classrooms.map((classroom) => (
                <tr key={classroom.classroom_id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{classroom.classroom_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{classroom.form_master}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{classroom.total_students}</td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${getAbsenceColor(classroom.absence_rate)}`}>
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-sm font-semibold">{classroom.absence_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{classroom.total_absences}</td>
                  <td className="px-4 py-3">
                    {classroom.is_high_risk ? (
                      <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-300">HIGH RISK</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-300">NORMAL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {classrooms.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No attendance data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
