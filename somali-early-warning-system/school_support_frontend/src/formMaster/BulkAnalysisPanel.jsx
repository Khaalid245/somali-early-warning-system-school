import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, AlertTriangle, AlertCircle, Activity, CheckCircle, Filter, RefreshCw, FileDown, Search, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';

// Exact same card constant as WeeklyReportPanel
const card = 'bg-white border border-gray-200 rounded-lg';

const RISK = {
  critical: { color: '#DC2626', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border border-red-200',      border: 'border-l-red-400',    text: 'text-red-600',    label: 'Critical', icon: AlertCircle },
  high:     { color: '#F59E0B', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border border-amber-200', border: 'border-l-amber-400',  text: 'text-amber-600',  label: 'High',     icon: AlertTriangle },
  moderate: { color: '#F59E0B', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', border: 'border-l-yellow-400', text: 'text-yellow-600', label: 'Moderate', icon: Activity },
  low:      { color: '#16A34A', dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border border-green-200',  border: 'border-l-green-400',  text: 'text-green-600',  label: 'Low',      icon: CheckCircle },
};

const BulkAnalysisPanel = () => {
  const [loading, setLoading]               = useState(false);
  const [analysisData, setAnalysisData]     = useState(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [currentPage, setCurrentPage]       = useState(1);
  const studentsPerPage = 20;

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalysis = useCallback(async (showSuccessToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/interventions/bulk-analysis/');
      setAnalysisData(response.data);
      if (showSuccessToast) showToast.success('Analysis refreshed successfully');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load analysis. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDisplayedStudents = useMemo(() => {
    if (!analysisData) return [];
    let students = selectedRiskLevel === 'all'
      ? [...analysisData.risk_groups.critical, ...analysisData.risk_groups.high, ...analysisData.risk_groups.moderate, ...analysisData.risk_groups.low]
      : analysisData.risk_groups[selectedRiskLevel] || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      students = students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toString().includes(q) ||
        s.classroom.toLowerCase().includes(q)
      );
    }
    return students;
  }, [analysisData, selectedRiskLevel, searchQuery]);

  const totalPages = Math.ceil(getDisplayedStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    return getDisplayedStudents.slice(start, start + studentsPerPage);
  }, [getDisplayedStudents, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [selectedRiskLevel, searchQuery]);

  const exportToCSV = () => {
    if (!analysisData) return;
    const headers = ['Student ID', 'Name', 'Classroom', 'Risk Score', 'Attendance Rate', 'Total Absences', 'Recent Absences'];
    const rows = getDisplayedStudents.map(s => [s.student_id, s.name, s.classroom, s.risk_score, s.attendance_rate, s.total_absences, s.recent_absences]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `bulk-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast.success('Report exported successfully');
  };

  const getRiskBadge = (score) => {
    if (score >= 75) return RISK.critical.badge;
    if (score >= 50) return RISK.high.badge;
    if (score >= 25) return RISK.moderate.badge;
    return RISK.low.badge;
  };

  // ── Loading skeleton — matches WeeklyReportPanel skeleton style
  if (loading && !analysisData) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
      </div>
    );
  }

  // ── Error state — matches WeeklyReportPanel error style exactly
  if (error && !analysisData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800 text-sm mb-1">Failed to Load Analysis</p>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button onClick={() => fetchAnalysis(false)} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center gap-1.5">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) return null;

  const hasStudents = analysisData.statistics.total_students > 0;
  const s = analysisData.statistics;

  const pieData = [
    { name: 'Critical Risk', value: s.critical_count, color: RISK.critical.color },
    { name: 'High Risk',     value: s.high_count,     color: RISK.high.color },
    { name: 'Moderate Risk', value: s.moderate_count, color: RISK.moderate.color },
    { name: 'Low Risk',      value: s.low_count,      color: RISK.low.color },
  ];

  const filterTabs = [
    { key: 'all',      label: 'All',      count: s.total_students },
    { key: 'critical', label: 'Critical', count: s.critical_count },
    { key: 'high',     label: 'High',     count: s.high_count },
    { key: 'moderate', label: 'Moderate', count: s.moderate_count },
    { key: 'low',      label: 'Low',      count: s.low_count },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header — identical structure to WeeklyReportPanel header */}
      <div className={`${card} p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
        <div>
          <h2 className="text-base font-medium text-gray-800">Class Risk Overview</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {s.total_students} student{s.total_students !== 1 ? 's' : ''} in this class
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={exportToCSV}
            disabled={!hasStudents}
            className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded text-sm hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => fetchAnalysis(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Summary Cards — same style as WeeklyReportPanel KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['critical', 'high', 'moderate', 'low']).map((key) => {
          const cfg = RISK[key];
          const count = s[`${key}_count`];
          const pct   = s[`${key}_percentage`];
          const Icon  = cfg.icon;
          return (
            <div
              key={key}
              onClick={() => setSelectedRiskLevel(key)}
              className={`${card} p-4 border-l-4 ${cfg.border} cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium">{cfg.label}</p>
                <Icon size={15} className={cfg.text} />
              </div>
              <p className="text-2xl font-semibold text-gray-800">{count}</p>
              <p className="text-xs text-gray-400 mt-1">{pct}% of students</p>
            </div>
          );
        })}
      </div>

      {/* ── Risk Distribution Chart — same card style as WeeklyReportPanel charts */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <BarChart3 size={15} className="text-gray-400" />
          Risk breakdown in this class
        </h3>
        <p className="text-xs text-gray-400 mb-4">Most students are low to moderate risk</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                outerRadius={85}
                dataKey="value"
                labelLine={false}
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} students`, name]}
                contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend — same dot + label style as WeeklyReportPanel pie legend */}
          <div className="space-y-3">
            {pieData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-gray-600">{name}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{value} <span className="text-xs text-gray-400 font-normal">students</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search + Filter — same card + tab style as WeeklyReportPanel filter tabs */}
      <div className={`${card} p-4`}>
        {/* Search row */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, student ID, or classroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600 transition">
              Clear
            </button>
          )}
        </div>

        {/* Filter tabs — exact same style as WeeklyReportPanel action filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedRiskLevel(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                selectedRiskLevel === key
                  ? 'bg-white border-green-500 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {label} · {count}
            </button>
          ))}
        </div>
      </div>

      {/* ── Students Table — same structure as WeeklyReportPanel top students table */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              {getDisplayedStudents.length} student{getDisplayedStudents.length !== 1 ? 's' : ''}
              {searchQuery ? <span className="text-gray-400 font-normal"> · filtered</span> : ''}
            </p>
          </div>
        </div>

        {!hasStudents ? (
          <div className="py-16 text-center">
            <Users className="mx-auto text-gray-300 mb-3" size={36} />
            <p className="text-sm font-semibold text-gray-600 mb-1">No Students Available for Analysis</p>
            <p className="text-xs text-gray-400">Add students and record attendance data to generate risk insights.</p>
          </div>
        ) : getDisplayedStudents.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="mx-auto text-gray-300 mb-3" size={36} />
            <p className="text-sm font-semibold text-gray-600 mb-1">No Students Match Filter</p>
            <p className="text-xs text-gray-400 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => { setSelectedRiskLevel('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* thead — exact same style as WeeklyReportPanel tables */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Classroom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Risk</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Attendance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Absences</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last 30 days</th>
                  </tr>
                </thead>
                {/* tbody — exact same py-[14px], divide-gray-100, hover:bg-gray-50 as WeeklyReportPanel */}
                <tbody className="divide-y divide-gray-100">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-[14px] text-sm text-gray-500">{student.student_id}</td>
                      <td className="px-4 py-[14px] text-sm font-medium text-gray-800">{student.name}</td>
                      <td className="px-4 py-[14px] text-sm text-gray-500 hidden sm:table-cell">{student.classroom}</td>
                      <td className="px-4 py-[14px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getRiskBadge(student.risk_score)}`}
                          title={`Risk Score: ${student.risk_score}/100`}
                        >
                          {student.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-[14px] text-sm text-right hidden md:table-cell">
                        <span className={
                          student.attendance_rate >= 85 ? 'text-green-700 font-medium' :
                          student.attendance_rate >= 75 ? 'text-yellow-700 font-medium' :
                          'text-red-700 font-medium'
                        }>
                          {student.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-[14px] text-sm text-gray-600 text-right hidden lg:table-cell">{student.total_absences}</td>
                      <td className="px-4 py-[14px] text-sm text-gray-600 text-right hidden lg:table-cell">{student.recent_absences}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination — same style as WeeklyReportPanel */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Showing {((currentPage - 1) * studentsPerPage) + 1}–{Math.min(currentPage * studentsPerPage, getDisplayedStudents.length)} of {getDisplayedStudents.length} students
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs border border-gray-200 bg-white rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs border border-gray-200 bg-white rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default BulkAnalysisPanel;
