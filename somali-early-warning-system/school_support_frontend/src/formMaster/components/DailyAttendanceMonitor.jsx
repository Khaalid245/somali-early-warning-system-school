import { useState, useEffect } from 'react';
import {
  TrendingUp, CheckCircle, XCircle, Clock,
  AlertTriangle, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../../api/apiClient';

const TODAY = new Date().toISOString().split('T')[0];

// ── Helpers ───────────────────────────────────────────────────────────────
const rateColor = (r) => r >= 75 ? 'text-green-600' : r >= 50 ? 'text-yellow-600' : 'text-red-600';

// ── Sub-components ────────────────────────────────────────────────────────
function PageHeader({ classroom, totalStudents, selectedDate, onDateChange }) {
  const isToday = selectedDate === TODAY;
  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Daily Attendance Monitor</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {classroom
            ? `${classroom} · ${totalStudents} students · ${isToday ? 'Today' : dateLabel}`
            : 'Loading…'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input
          type="date"
          value={selectedDate}
          max={TODAY}
          onChange={e => onDateChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function DailyAttendanceMonitor() {
  const [data,         setData]        = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState(false);
  const [selectedDate, setDate]        = useState(TODAY);
  const [sessionsOpen, setSessionsOpen] = useState(true);

  useEffect(() => { load(); }, [selectedDate]);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get(`/attendance/daily-monitor/?date=${selectedDate}`);
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const headerProps = {
    classroom:     data?.classroom,
    totalStudents: data?.total_students,
    selectedDate,
    onDateChange:  setDate,
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-5">
      <PageHeader {...headerProps} />
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) return (
    <div className="space-y-5">
      <PageHeader {...headerProps} />
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
        <p className="text-sm text-red-600 mb-3">Failed to load attendance data.</p>
        <button onClick={load} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
          Retry
        </button>
      </div>
    </div>
  );

  // ── No sessions ───────────────────────────────────────────────────────
  if (!data?.subject_summaries?.length) return (
    <div className="space-y-5">
      <PageHeader {...headerProps} />
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-1">No attendance recorded</p>
        <p className="text-xs text-gray-400">
          No sessions found for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}. Try a different date.
        </p>
      </div>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────
  const breakdown      = data.student_breakdown ?? [];
  const sessions       = data.subject_summaries ?? [];
  const fullDayAbsent  = data.full_day_absent_students ?? [];

  const presentIds = new Set(
    breakdown.filter(s => s.subjects.some(x => x.status === 'present')).map(s => s.student_id)
  );
  const lateIds = new Set(
    breakdown.filter(s => s.subjects.some(x => x.status === 'late')).map(s => s.student_id)
  );
  const absentAllDayIds = new Set(fullDayAbsent.map(s => s.student_id));

  const presentCount = presentIds.size;
  const absentCount  = fullDayAbsent.length;
  const lateCount    = sessions.reduce((s, x) => s + x.late_count, 0);
  const rate         = data.total_students > 0
    ? ((presentCount / data.total_students) * 100).toFixed(0)
    : 0;

  // Needs attention = absent all day OR late in any session
  const needsAttention = breakdown.filter(s =>
    absentAllDayIds.has(s.student_id) || lateIds.has(s.student_id)
  );

  // Class overview: all students, worst status
  const overallStatus = (s) => {
    if (absentAllDayIds.has(s.student_id)) return 'absent';
    if (lateIds.has(s.student_id))         return 'late';
    if (presentIds.has(s.student_id))      return 'present';
    return 'not_recorded';
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Header ──────────────────────────────────────────────────── */}
      <PageHeader {...headerProps} />

      {/* ── 2. Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp,  label: 'Attendance Rate', value: `${rate}%`,    color: 'text-yellow-600' },
          { icon: CheckCircle, label: 'Present',         value: presentCount,  color: 'text-green-600'  },
          { icon: XCircle,     label: 'Absent',          value: absentCount,   color: absentCount  > 0 ? 'text-red-600'    : 'text-gray-300' },
          { icon: Clock,       label: 'Late',            value: lateCount,     color: lateCount    > 0 ? 'text-yellow-600' : 'text-gray-300' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Alert Banner ────────────────────────────────────────────── */}
      {absentCount > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">{absentCount} student{absentCount !== 1 ? 's' : ''} absent all day: </span>
            {fullDayAbsent.map(s => s.student_name).join(', ')}
          </span>
        </div>
      )}

      {/* ── 4. Needs Attention ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <p className="text-sm font-semibold text-gray-900">Needs Attention Today</p>
          {needsAttention.length > 0 && (
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {needsAttention.length}
            </span>
          )}
        </div>
        {needsAttention.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">All students present today</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {needsAttention.map(s => {
              const isAbsent = absentAllDayIds.has(s.student_id);
              return (
                <li key={s.student_id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isAbsent ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <p className="text-sm font-medium text-gray-800">{s.student_name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    isAbsent
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  }`}>
                    {isAbsent ? 'Absent' : 'Late'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── 5. Session Summary ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          onClick={() => setSessionsOpen(o => !o)}
        >
          <p className="text-sm font-semibold text-gray-900">Today's Sessions</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
            {sessionsOpen
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </div>
        </button>
        {sessionsOpen && (
          <ul className="divide-y divide-gray-50">
            {sessions.map(s => (
              <li key={s.session_id} className="flex items-center justify-between px-4 py-3 gap-3">
                <p className="text-sm font-medium text-gray-800">{s.subject_name}</p>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-green-700 font-medium">{s.present_count} present</span>
                  {s.absent_count > 0 && (
                    <span className="text-red-600 font-medium">{s.absent_count} absent</span>
                  )}
                  {s.late_count > 0 && (
                    <span className="text-yellow-600 font-medium">{s.late_count} late</span>
                  )}
                  <span className={`font-semibold ${rateColor(s.attendance_rate)}`}>
                    {s.attendance_rate}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 6. Class Overview ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Class Overview</p>
        </div>
        <ul className="divide-y divide-gray-50">
          {breakdown.map(s => {
            const status = overallStatus(s);
            const Icon   = status === 'present' ? CheckCircle
                         : status === 'absent'  ? XCircle
                         : status === 'late'    ? Clock
                         : null;
            const iconCls = status === 'present' ? 'text-green-500'
                          : status === 'absent'  ? 'text-red-500'
                          : status === 'late'    ? 'text-yellow-500'
                          : 'text-gray-300';
            const badgeCls = status === 'present'      ? 'bg-green-50 text-green-700 border-green-100'
                           : status === 'absent'       ? 'bg-red-50 text-red-600 border-red-100'
                           : status === 'late'         ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                           : 'bg-gray-50 text-gray-400 border-gray-100';
            const badgeLabel = status === 'not_recorded' ? 'Not recorded'
                             : status.charAt(0).toUpperCase() + status.slice(1);
            return (
              <li key={s.student_id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {Icon
                    ? <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} />
                    : <span className="w-4 h-4 shrink-0 rounded-full bg-gray-200 inline-block" />
                  }
                  <p className="text-sm text-gray-800">{s.student_name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${badgeCls}`}>
                  {badgeLabel}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
