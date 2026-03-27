import { useEffect, useState } from 'react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';
import {
  TrendingUp, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw,
} from 'lucide-react';

const STATUS_BADGE = {
  present:      'bg-green-100 text-green-700',
  absent:       'bg-red-100 text-red-700',
  late:         'bg-yellow-100 text-yellow-700',
  not_recorded: 'bg-gray-100 text-gray-500',
};

const label = (s) => s === 'not_recorded' ? 'Not recorded' : s.charAt(0).toUpperCase() + s.slice(1);

export default function DailyMonitor() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { load(date); }, [date]);

  const load = async (d) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/daily-monitor/?date=${d}`);
      setData(res.data);
    } catch {
      showToast.error('Failed to load daily monitor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
    </div>
  );

  // ── Derived counts ────────────────────────────────────────────────────────
  const total    = data?.total_students ?? 0;
  const sessions = data?.subject_summaries ?? [];
  const breakdown = data?.student_breakdown ?? [];
  const fullDayAbsent = data?.full_day_absent_students ?? [];

  // Aggregate across all sessions for summary cards
  const totalPresent = sessions.reduce((s, x) => s + x.present_count, 0);
  const totalAbsent  = sessions.reduce((s, x) => s + x.absent_count,  0);
  const totalLate    = sessions.reduce((s, x) => s + x.late_count,    0);
  const totalRecords = totalPresent + totalAbsent + totalLate;
  const rate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '—';

  // Students with any absence or late today (for "Needs Attention")
  const needsAttention = breakdown.filter(s =>
    s.subjects.some(sub => sub.status === 'absent' || sub.status === 'late')
  );

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily Attendance Monitor</h2>
          <p className="text-sm text-gray-500">
            {data?.classroom ?? '—'} · {total} students · {displayDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => load(date)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp,   label: 'Attendance Rate', value: `${rate}%`,       color: 'text-yellow-600' },
          { icon: CheckCircle,  label: 'Present',         value: totalPresent,      color: 'text-green-600'  },
          { icon: XCircle,      label: 'Absent',          value: totalAbsent,       color: 'text-red-600'    },
          { icon: Clock,        label: 'Late',            value: totalLate,         color: 'text-yellow-500' },
        ].map(({ icon: Icon, label: lbl, value, color }) => (
          <div key={lbl} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex items-center gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-gray-500">{lbl}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alert Banner ───────────────────────────────────────────────── */}
      {fullDayAbsent.length > 0 && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
          <span>
            <span className="font-semibold">{fullDayAbsent.length} student{fullDayAbsent.length > 1 ? 's' : ''} absent all day: </span>
            {fullDayAbsent.map(s => s.student_name).join(', ')}
          </span>
        </div>
      )}

      {/* ── No sessions recorded ───────────────────────────────────────── */}
      {sessions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center text-sm text-gray-500">
          No attendance sessions recorded for this date.
        </div>
      )}

      {sessions.length > 0 && (
        <>
          {/* ── Needs Attention ──────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-800">Needs Attention Today</h3>
              {needsAttention.length > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {needsAttention.length}
                </span>
              )}
            </div>
            {needsAttention.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                All students present today
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {needsAttention.map(s => {
                  const worstStatus = s.subjects.some(x => x.status === 'absent') ? 'absent' : 'late';
                  const absentSubjects = s.subjects.filter(x => x.status === 'absent').map(x => x.subject_name);
                  const lateSubjects  = s.subjects.filter(x => x.status === 'late').map(x => x.subject_name);
                  const detail = [
                    absentSubjects.length ? `Absent: ${absentSubjects.join(', ')}` : '',
                    lateSubjects.length   ? `Late: ${lateSubjects.join(', ')}`     : '',
                  ].filter(Boolean).join(' · ');
                  return (
                    <li key={s.student_id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{s.student_name}</p>
                        {detail && <p className="text-xs text-gray-500 truncate">{detail}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[worstStatus]}`}>
                        {label(worstStatus)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Session Summary ───────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Today's Sessions</h3>
            </div>
            <ul className="divide-y divide-gray-50">
              {sessions.map(s => (
                <li key={s.session_id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <p className="text-sm font-medium text-gray-800">{s.subject_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="text-green-700 font-medium">{s.present_count} present</span>
                    <span className="text-red-600 font-medium">{s.absent_count} absent</span>
                    <span className="text-gray-400">{s.attendance_rate}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Class Overview ────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Class Overview</h3>
            </div>
            <ul className="divide-y divide-gray-50">
              {breakdown.map(s => {
                // Determine overall status: worst across sessions
                const statuses = s.subjects.map(x => x.status);
                const overall = statuses.includes('absent')       ? 'absent'
                              : statuses.includes('late')         ? 'late'
                              : statuses.includes('present')      ? 'present'
                              : 'not_recorded';
                const Icon = overall === 'present' ? CheckCircle
                           : overall === 'absent'  ? XCircle
                           : overall === 'late'    ? Clock
                           : null;
                const iconColor = overall === 'present' ? 'text-green-500'
                                : overall === 'absent'  ? 'text-red-500'
                                : overall === 'late'    ? 'text-yellow-500'
                                : 'text-gray-300';
                return (
                  <li key={s.student_id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {Icon
                        ? <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
                        : <span className="w-4 h-4 flex-shrink-0 rounded-full bg-gray-200" />
                      }
                      <p className="text-sm text-gray-800">{s.student_name}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[overall]}`}>
                      {label(overall)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
