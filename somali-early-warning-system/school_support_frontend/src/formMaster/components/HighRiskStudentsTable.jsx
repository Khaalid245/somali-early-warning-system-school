import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Search, ChevronRight, X, User } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────
const riskMeta = (rate) => {
  if (rate < 50)  return { label: 'Critical', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500' };
  if (rate < 75)  return { label: 'Monitor',  color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' };
  return           { label: 'Stable',   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500' };
};

const RISK_BADGE = {
  critical: 'bg-red-50 text-red-700 border border-red-200',
  high:     'bg-red-50 text-red-600 border border-red-200',
  medium:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  low:      'bg-gray-100 text-gray-500 border border-gray-200',
};

// ── Detail Panel ──────────────────────────────────────────────────────────
function StudentDetailPanel({ student, onClose, onCreateCase, hasCase }) {
  const meta = riskMeta(student.attendance_rate);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{student.student__full_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                ID: {student.student__student_id}
                {student.classroom && student.classroom !== 'Not Enrolled' && ` · ${student.classroom}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Risk status */}
          <div className={`p-4 rounded-lg border ${meta.bg} ${meta.border}`}>
            <p className={`text-xs font-semibold ${meta.color} mb-1`}>Risk Status</p>
            <p className={`text-2xl font-bold ${meta.color}`}>{meta.label}</p>
            <p className="text-xs text-gray-500 mt-1">
              {student.attendance_rate < 50
                ? 'Immediate intervention required'
                : student.attendance_rate < 75
                ? 'Needs monitoring and support'
                : 'Attendance within acceptable range'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Attendance', value: `${student.attendance_rate}%`, color: meta.color },
              { label: 'Absences',   value: student.absent_count,          color: student.absent_count > 0 ? 'text-red-600' : 'text-gray-400' },
              { label: 'Late',       value: student.late_count,            color: student.late_count > 0 ? 'text-yellow-600' : 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* School days */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total school days recorded</span>
            <span className="text-sm font-semibold text-gray-800">
              {student.total_days ?? student.total_sessions ?? '—'}
            </span>
          </div>

          {/* Risk profile badge */}
          {student.risk_level && (
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Risk profile</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_BADGE[student.risk_level?.toLowerCase()] || RISK_BADGE.low}`}>
                {student.risk_level?.charAt(0).toUpperCase() + student.risk_level?.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          {hasCase ? (
            <div className="w-full py-2.5 text-center text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
              Intervention Case Already Open
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onCreateCase(student); }}
              className="w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Intervention Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function HighRiskStudentsTable({ students, getRiskBadgeColor, onCreateCase, existingCaseStudentIds = [] }) {
  const [search,   setSearch]   = useState('');
  const [riskFilter, setRisk]   = useState('all');
  const [sortBy,   setSort]     = useState('attendance');
  const [selected, setSelected] = useState(null);

  // ── Summary counts ────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const list = students || [];
    return {
      critical: list.filter(s => s.attendance_rate < 50).length,
      monitor:  list.filter(s => s.attendance_rate >= 50 && s.attendance_rate < 75).length,
      stable:   list.filter(s => s.attendance_rate >= 75).length,
    };
  }, [students]);

  // ── Filtered + sorted list ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = (students || []).filter(s => {
      const q = search.toLowerCase();
      if (q && !s.student__full_name?.toLowerCase().includes(q) &&
               !String(s.student__student_id).includes(q)) return false;
      if (riskFilter === 'critical' && s.attendance_rate >= 50)  return false;
      if (riskFilter === 'monitor'  && (s.attendance_rate < 50 || s.attendance_rate >= 75)) return false;
      if (riskFilter === 'stable'   && s.attendance_rate < 75)   return false;
      return true;
    });
    if (sortBy === 'attendance') list = [...list].sort((a, b) => a.attendance_rate - b.attendance_rate);
    if (sortBy === 'absences')   list = [...list].sort((a, b) => b.absent_count - a.absent_count);
    if (sortBy === 'name')       list = [...list].sort((a, b) => a.student__full_name?.localeCompare(b.student__full_name));
    return list;
  }, [students, search, riskFilter, sortBy]);

  // ── Empty state ───────────────────────────────────────────────────────
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-base font-semibold text-gray-800 mb-1">All students on track</p>
          <p className="text-sm text-gray-400">No students currently below the 75% attendance threshold.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mb-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Students Needing Support</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Students with attendance below 75% or repeated absences
          </p>
        </div>

        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'critical', label: 'Critical',  count: counts.critical, bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700',    sub: 'text-red-400',    desc: 'Below 50%' },
            { key: 'monitor',  label: 'Monitor',   count: counts.monitor,  bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', sub: 'text-yellow-400', desc: '50 – 74%' },
            { key: 'stable',   label: 'Stable',    count: counts.stable,   bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700',  sub: 'text-green-400',  desc: '75% or above' },
          ].map(card => (
            <button
              key={card.key}
              onClick={() => setRisk(riskFilter === card.key ? 'all' : card.key)}
              className={`${card.bg} border ${card.border} rounded-lg p-4 text-left transition-all hover:shadow-sm ${riskFilter === card.key ? 'ring-2 ring-offset-1 ring-gray-300' : ''}`}
            >
              <p className={`text-2xl font-bold ${card.text}`}>{card.count}</p>
              <p className={`text-sm font-medium ${card.text} mt-0.5`}>{card.label}</p>
              <p className={`text-xs ${card.sub} mt-0.5`}>{card.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white placeholder-gray-400"
            />
          </div>

          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={e => setRisk(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
          >
            <option value="all">All risk levels</option>
            <option value="critical">Critical (&lt;50%)</option>
            <option value="monitor">Monitor (50–74%)</option>
            <option value="stable">Stable (≥75%)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700"
          >
            <option value="attendance">Sort: Attendance ↑</option>
            <option value="absences">Sort: Absences ↓</option>
            <option value="name">Sort: Name A–Z</option>
          </select>

          {/* Result count */}
          <span className="text-xs text-gray-400 ml-auto shrink-0">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No students match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase w-8">#</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Risk</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Attendance</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Absences</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Late</th>
                    <th className="w-8 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((student, idx) => {
                    const meta    = riskMeta(student.attendance_rate);
                    const rLevel  = student.risk_level?.toLowerCase();
                    const rBadge  = RISK_BADGE[rLevel] || RISK_BADGE.low;
                    const rLabel  = student.risk_level?.charAt(0).toUpperCase() + student.risk_level?.slice(1);

                    return (
                      <tr
                        key={student.student__student_id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => setSelected(student)}
                      >
                        {/* # */}
                        <td className="px-6 py-4 text-xs text-gray-400 font-medium">{idx + 1}</td>

                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{student.student__full_name}</p>
                              <p className="text-xs text-gray-400">
                                {student.student__student_id}
                                {student.classroom && student.classroom !== 'Not Enrolled' && ` · ${student.classroom}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Risk badge */}
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rBadge}`}>
                            {rLabel}
                          </span>
                        </td>

                        {/* Attendance % */}
                        <td className="px-4 py-4 text-center">
                          <span className={`text-base font-bold ${meta.color}`}>
                            {student.attendance_rate}%
                          </span>
                        </td>

                        {/* Absences */}
                        <td className="px-4 py-4 text-center">
                          <span className={`text-base font-bold ${student.absent_count > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                            {student.absent_count}
                          </span>
                        </td>

                        {/* Late */}
                        <td className="px-4 py-4 text-center">
                          <span className={`text-base font-bold ${student.late_count > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>
                            {student.late_count}
                          </span>
                        </td>

                        {/* Arrow */}
                        <td className="px-4 py-4">
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {selected && (
        <StudentDetailPanel
          student={selected}
          onClose={() => setSelected(null)}
          onCreateCase={onCreateCase}
          hasCase={existingCaseStudentIds.includes(selected.student__student_id)}
        />
      )}
    </>
  );
}
