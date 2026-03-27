import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { ArrowLeft, AlertTriangle, FileText, User, GitBranch } from 'lucide-react';

const RISK = {
  critical: { badge: 'bg-red-50 text-red-700 border border-red-200',         label: 'Critical'  },
  high:     { badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'High Risk' },
  medium:   { badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'Monitor'   },
  low:      { badge: 'bg-green-50 text-green-700 border border-green-200',    label: 'Good'      },
};

const DAY_STATUS = {
  'absent':          { cls: 'bg-red-100 text-red-700',       label: 'Absent'          },
  'half-day absent': { cls: 'bg-orange-100 text-orange-700', label: 'Half-day Absent' },
  'late':            { cls: 'bg-yellow-100 text-yellow-700', label: 'Late'            },
  'present':         { cls: 'bg-green-100 text-green-700',   label: 'Present'         },
};

const PERIOD_LABEL = {
  '1': 'P1', '2': 'P2', '3': 'P3', '4': 'P4', '5': 'P5', '6': 'P6',
  morning: 'AM', afternoon: 'PM',
};

const attendanceColor = (rate) => {
  if (rate >= 90) return 'text-green-600';
  if (rate >= 80) return 'text-yellow-600';
  if (rate >= 75) return 'text-orange-600';
  return 'text-red-600';
};

const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

const WINDOWS = [
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 60, label: '2 Months' },
  { days: 90, label: 'Full Term' },
];

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [roster,        setRoster]        = useState(null);
  const [history,       setHistory]       = useState(null);
  const [histDays,      setHistDays]      = useState(30);
  const [histLoading,   setHistLoading]   = useState(false);
  const [histError,     setHistError]     = useState(false);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [pageError,     setPageError]     = useState(null);
  const [crossPattern,  setCrossPattern]  = useState(null);
  const [crossLoading,  setCrossLoading]  = useState(false);
  const [crossDays,     setCrossDays]     = useState(60);

  // Load student summary from roster
  useEffect(() => {
    api.get('/dashboard/my-class/')
      .then(res => {
        const student = res.data.students?.find(s => String(s.student_id) === String(studentId));
        if (!student) { setPageError('Student not found in your class.'); return; }
        setRoster(student);
      })
      .catch(() => setPageError('Failed to load student data.'))
      .finally(() => setPageLoading(false));
  }, [studentId]);

  // Load attendance history
  useEffect(() => {
    if (!studentId) return;
    setHistLoading(true);
    setHistError(false);
    api.get(`/dashboard/my-class/?student_id=${studentId}&days=${histDays}`)
      .then(res => setHistory(res.data.history || []))
      .catch(() => setHistError(true))
      .finally(() => setHistLoading(false));
  }, [studentId, histDays]);

  // Load cross-subject pattern
  useEffect(() => {
    if (!studentId) return;
    setCrossLoading(true);
    api.get(`/attendance/cross-subject-pattern/${studentId}/?days=${crossDays}`)
      .then(res => setCrossPattern(res.data))
      .catch(() => setCrossPattern(null))
      .finally(() => setCrossLoading(false));
  }, [studentId, crossDays]);

  const handleTabClick = () => navigate('/form-master');

  const shell = (children) => (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabClick} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={{}} />
        <div className="flex-1 flex items-center justify-center">{children}</div>
      </div>
    </div>
  );

  if (pageLoading) return shell(<p className="text-gray-500 text-sm">Loading student data…</p>);
  if (pageError)   return shell(
    <div className="text-center">
      <p className="text-red-600 text-sm mb-3">{pageError}</p>
      <button onClick={() => navigate('/form-master/my-class')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
        Back to Class List
      </button>
    </div>
  );

  const risk     = RISK[roster.risk_level] || RISK.low;
  const isCritical = roster.risk_level === 'critical' || roster.risk_level === 'high';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabClick} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={{}} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">

            {/* ── Back + header ── */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/form-master/my-class')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Class List
              </button>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{roster.full_name}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">#{roster.admission_number} · {roster.classroom_name}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.badge}`}>
                  {risk.label}
                </span>
              </div>
            </div>

            {/* ── Chronic / persistent absentee flags ── */}
            {(roster.persistent_absentee || roster.chronic_absentee || roster.intervention_count > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {roster.chronic_absentee && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    🔴 Chronic Absentee
                  </span>
                )}
                {roster.persistent_absentee && !roster.chronic_absentee && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    ⚠️ Persistent Absentee
                  </span>
                )}
                {roster.intervention_count > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    📋 {roster.intervention_count} prior case{roster.intervention_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p className="text-xs text-gray-500 mb-1">Attendance Rate</p>
                <p className={`text-2xl font-bold ${attendanceColor(roster.attendance_rate)}`}>{roster.attendance_rate}%</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p className="text-xs text-gray-500 mb-1">Days Present</p>
                <p className="text-2xl font-bold text-green-600">{roster.present_days}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p className="text-xs text-gray-500 mb-1">Days Absent</p>
                <p className="text-2xl font-bold text-red-600">{roster.absent_days}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p className="text-xs text-gray-500 mb-1">Late Arrivals</p>
                <p className="text-2xl font-bold text-yellow-600">{roster.late_days}</p>
              </div>
            </div>

            {/* ── Consecutive absence warning ── */}
            {roster.consecutive_absent_days >= 3 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-4 sm:mb-6">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  {roster.consecutive_absent_days} consecutive days absent — follow-up required
                </p>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              {isCritical && (
                <button
                  onClick={() => navigate(`/form-master/interventions?student=${studentId}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                >
                  <AlertTriangle className="w-4 h-4" /> Escalate Student
                </button>
              )}
              <button
                onClick={() => navigate(`/form-master/interventions?student=${studentId}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
              >
                <FileText className="w-4 h-4" /> Open Intervention Case
              </button>
            </div>

            {/* ── Cross-Subject Pattern ── */}
            <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Cross-Subject Absence Pattern</h3>
                </div>
                <div className="flex gap-1">
                  {[{days:30,label:'1 Month'},{days:60,label:'2 Months'},{days:90,label:'Full Term'}].map(w => (
                    <button
                      key={w.days}
                      onClick={() => setCrossDays(w.days)}
                      className={`px-2.5 py-1 rounded text-xs border transition ${
                        crossDays === w.days
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {crossLoading && <p className="text-xs text-gray-400 py-4 text-center">Analysing cross-subject patterns…</p>}

                {!crossLoading && crossPattern && (
                  <>
                    {/* Summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">Days absent in 2+ subjects</p>
                        <p className="text-xl font-bold text-red-600 mt-0.5">{crossPattern.summary.total_pattern_days}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">Full-day absences</p>
                        <p className="text-xl font-bold text-orange-600 mt-0.5">{crossPattern.summary.full_day_absences}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500">Most missed subject</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
                          {crossPattern.summary.most_missed_subjects[0]?.subject || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Recurring pairs */}
                    {crossPattern.summary.recurring_pairs.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Subjects frequently missed together:</p>
                        <div className="flex flex-wrap gap-2">
                          {crossPattern.summary.recurring_pairs.map((pair, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700">
                              {pair.subjects.join(' + ')} &nbsp;·&nbsp; {pair.co_absent_days}×
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pattern days list */}
                    {crossPattern.pattern_days.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">No days found where this student was absent in 2 or more subjects simultaneously.</p>
                    ) : (
                      <div className="space-y-2">
                        {crossPattern.pattern_days.map(day => (
                          <div key={day.date} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-red-50">
                              <div>
                                <span className="text-xs font-semibold text-gray-800">
                                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-red-700">
                                {day.absent_count} of {day.total_subjects_recorded} subjects absent
                              </span>
                            </div>
                            <div className="px-3 py-2 flex flex-wrap gap-1.5">
                              {day.absent_subjects.map(subj => (
                                <span key={subj} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                  {subj}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!crossLoading && !crossPattern && (
                  <p className="text-xs text-gray-400 py-4 text-center">Could not load cross-subject pattern data.</p>
                )}
              </div>
            </div>

            {/* ── Attendance history ── */}
            <div className="bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800">Attendance History</h3>
                <div className="flex gap-1">
                  {WINDOWS.map(w => (
                    <button
                      key={w.days}
                      onClick={() => setHistDays(w.days)}
                      className={`px-2.5 py-1 rounded text-xs border transition ${
                        histDays === w.days
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {histLoading && <p className="text-xs text-gray-400 py-6 text-center">Loading attendance records…</p>}
                {histError   && <p className="text-xs text-red-500 py-6 text-center">Could not load history. Try again.</p>}
                {!histLoading && !histError && history?.length === 0 && (
                  <p className="text-xs text-gray-400 py-6 text-center">No attendance records found for this period.</p>
                )}
                {!histLoading && !histError && history?.length > 0 && (
                  <div className="space-y-1.5">
                    {history.map(day => {
                      const cfg = DAY_STATUS[day.day_status] || DAY_STATUS['present'];
                      return (
                        <div key={day.date} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-medium text-gray-700">{formatDate(day.date)}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {day.sessions?.length > 0 && (
                            <div className="border-t border-gray-200 px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
                              {day.sessions.map((s, i) => (
                                <span key={i} className="text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">{PERIOD_LABEL[s.period] || s.period}</span>
                                  {' '}{s.subject}
                                  {' '}—{' '}
                                  <span className={
                                    s.status === 'absent'  ? 'text-red-600 font-medium' :
                                    s.status === 'late'    ? 'text-yellow-600 font-medium' :
                                    s.status === 'present' ? 'text-green-600' : 'text-gray-600'
                                  }>
                                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
