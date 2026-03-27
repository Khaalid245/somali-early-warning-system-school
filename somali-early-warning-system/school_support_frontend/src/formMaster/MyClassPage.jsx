import { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Users, Search, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const RISK = {
  critical: { badge: 'bg-red-50 text-red-700 border border-red-200',         label: 'Critical',  row: 'bg-red-50/40',    order: 0 },
  high:     { badge: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'High Risk', row: 'bg-orange-50/30', order: 1 },
  medium:   { badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'Monitor',   row: '',                order: 2 },
  low:      { badge: 'bg-green-50 text-green-700 border border-green-200',    label: 'Good',      row: '',                order: 3 },
};

// <50% red · 50–75% yellow/orange · >75% green
const attendanceColor = (rate) => {
  if (rate > 75)  return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const PAGE_SIZE = 15;

export default function MyClassPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy,     setSortBy]     = useState('risk');
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    api.get('/dashboard/my-class/')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load class data'))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterRisk, sortBy]);

  const allStudents = data?.students || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStudents
      .filter(s => {
        if (filterRisk !== 'all' && s.risk_level !== filterRisk) return false;
        if (q) return s.full_name.toLowerCase().includes(q) || String(s.admission_number).toLowerCase().includes(q);
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'attendance') return a.attendance_rate - b.attendance_rate;
        if (sortBy === 'absences')   return b.absent_days - a.absent_days;
        // Default: risk order → attendance asc → absences desc
        const oa = RISK[a.risk_level]?.order ?? 3;
        const ob = RISK[b.risk_level]?.order ?? 3;
        if (oa !== ob) return oa - ob;
        if (a.attendance_rate !== b.attendance_rate) return a.attendance_rate - b.attendance_rate;
        return b.absent_days - a.absent_days;
      });
  }, [allStudents, search, filterRisk, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageEnd    = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageRows   = filtered.slice(pageStart, pageEnd);

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    allStudents.forEach(s => { if (c[s.risk_level] !== undefined) c[s.risk_level]++; });
    return c;
  }, [allStudents]);

  const needsAction = counts.critical + counts.high;
  const monitoring  = counts.medium;
  const stable      = counts.low;

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

  if (loading) return shell(<p className="text-gray-500 text-sm">Loading class roster…</p>);
  if (error)   return shell(
    <div className="text-center">
      <p className="text-red-600 text-sm mb-3">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} onLogout={logout} onTabChange={handleTabClick} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} dashboardData={{}} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">

            {/* ── Header ── */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                My Class — Student List
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {data?.classrooms?.map(c => c.classroom_name).join(' · ')} · {allStudents.length} students enrolled
              </p>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Needs Action */}
              <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-red-500 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-xs mb-1">Needs Action</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{needsAction}</p>
              </div>
              {/* Monitoring */}
              <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-yellow-400 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  </div>
                </div>
                <p className="text-gray-600 text-xs mb-1">Monitoring</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{monitoring}</p>
              </div>
              {/* Stable */}
              <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-green-500 p-3 sm:p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-xs mb-1">Stable</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stable}</p>
              </div>
            </div>

            {/* ── Search + Filter bar ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Risk</label>
                <select
                  value={filterRisk}
                  onChange={e => setFilterRisk(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Monitor</option>
                  <option value="low">Good</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Sort by</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="risk">Risk Level</option>
                  <option value="attendance">Attendance %</option>
                  <option value="absences">Absences</option>
                </select>
              </div>

              <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                {filtered.length} of {allStudents.length} students
              </span>
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-500" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                No students match the selected filters.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendance %</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Absences</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pageRows.map((student, idx) => {
                        const risk = RISK[student.risk_level] || RISK.low;
                        return (
                          <tr
                            key={student.student_id}
                            onClick={() => navigate(`/form-master/student/${student.student_id}`)}
                            className={`cursor-pointer hover:bg-gray-50/80 transition-colors ${risk.row}`}
                          >
                            <td className="px-4 py-4 text-xs text-gray-400 font-mono">
                              {pageStart + idx + 1}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-800 text-sm leading-tight">{student.full_name}</p>
                              <p className="text-xs text-gray-400 mt-1">#{student.admission_number} · {student.classroom_name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${risk.badge}`}>
                                {risk.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-base font-bold ${attendanceColor(student.attendance_rate)}`}>
                                {student.attendance_rate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-base font-semibold text-gray-700">{student.absent_days}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {pageRows.map((student, idx) => {
                    const risk = RISK[student.risk_level] || RISK.low;
                    return (
                      <div
                        key={student.student_id}
                        onClick={() => navigate(`/form-master/student/${student.student_id}`)}
                        className={`p-4 cursor-pointer hover:bg-gray-50/80 transition-colors ${risk.row}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono">{pageStart + idx + 1}.</span>
                              <p className="font-semibold text-sm text-gray-800 truncate">{student.full_name}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 ml-5">#{student.admission_number} · {student.classroom_name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${risk.badge}`}>
                            {risk.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center ml-5">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Attendance</p>
                            <p className={`text-sm font-bold ${attendanceColor(student.attendance_rate)}`}>{student.attendance_rate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Absences</p>
                            <p className="text-sm font-semibold text-gray-700">{student.absent_days}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination footer ── */}
                <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    Showing{' '}
                    <span className="font-semibold text-gray-700">{pageStart + 1}–{pageEnd}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-gray-700">{filtered.length}</span> students
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    {/* Page numbers — show up to 5 around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 text-xs font-medium rounded-lg border transition ${
                              p === safePage
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )
                    }

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
