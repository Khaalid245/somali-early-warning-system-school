import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, RefreshCw, FileDown, BarChart3, Activity, Users, FileText, UserCheck, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';

const card = 'bg-white border border-gray-200 rounded-lg';

const WeeklyReportPanel = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchReport = useCallback(async (showSuccessToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/interventions/weekly-report/');
      setReportData(response.data);
      if (showSuccessToast) showToast.success('Report refreshed successfully');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load weekly report.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToCSV = () => {
    if (!reportData) return;
    const headers = ['Rank', 'Student ID', 'Name', 'Risk Score', 'Recommendations'];
    const rows = reportData.top_priority_students.map((s, i) => [
      i + 1, s.student_id, s.name, s.risk_score,
      s.recommendations?.map(r => r.action).join('; ') || 'None'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `weekly-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast.success('Report exported successfully');
  };

  const getPriorityStyle = (priority) => ({
    URGENT: 'border-red-400 bg-red-50 text-red-800',
    HIGH:   'border-orange-400 bg-orange-50 text-orange-800',
    MEDIUM: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    LOW:    'border-green-400 bg-green-50 text-green-800',
  }[priority] || 'border-gray-300 bg-gray-50 text-gray-700');

  const actionBadgeStyle = (type) => ({
    case_created:       'bg-gray-100 text-gray-700 border border-gray-200',
    meeting_scheduled:  'bg-gray-100 text-gray-700 border border-gray-200',
    followup_planned:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
    progress_update:    'bg-green-50 text-green-700 border border-green-200',
    case_closed:        'bg-green-50 text-green-700 border border-green-200',
    case_escalated:     'bg-red-50 text-red-700 border border-red-200',
  }[type] || 'bg-gray-100 text-gray-700 border border-gray-200');

  if (loading && !reportData) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800 text-sm mb-1">Failed to Load Weekly Report</p>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button onClick={() => fetchReport(false)} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition flex items-center gap-1.5">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  // Build flat action list
  const allActions = [];
  reportData.action_log?.forEach(log => {
    log.actions.forEach(action => {
      allActions.push({
        student_name: log.student_name,
        student_id: log.student_id,
        case_id: log.case_id,
        action_type: action.type,
        action_label: action.action,
        action_details: action.details,
        action_date: new Date(action.date),
      });
    });
  });
  allActions.sort((a, b) => b.action_date - a.action_date);

  const filteredActions = actionFilter === 'all'
    ? allActions
    : allActions.filter(a => a.action_type === actionFilter);

  const counts = {
    all: allActions.length,
    case_created:      allActions.filter(a => a.action_type === 'case_created').length,
    meeting_scheduled: allActions.filter(a => a.action_type === 'meeting_scheduled').length,
    followup_planned:  allActions.filter(a => a.action_type === 'followup_planned').length,
    progress_update:   allActions.filter(a => a.action_type === 'progress_update').length,
    case_closed:       allActions.filter(a => a.action_type === 'case_closed').length,
    case_escalated:    allActions.filter(a => a.action_type === 'case_escalated').length,
  };

  const filterTabs = [
    { key: 'all',              label: 'All',         icon: null },
    { key: 'case_created',     label: 'Case Opened', icon: <FileText size={13} /> },
    { key: 'meeting_scheduled',label: 'Meeting',     icon: <Users size={13} /> },
    { key: 'followup_planned', label: 'Follow-up',   icon: <Clock size={13} /> },
    { key: 'progress_update',  label: 'Improving',   icon: <Activity size={13} /> },
    { key: 'case_closed',      label: 'Closed',      icon: <CheckCircle size={13} /> },
    { key: 'case_escalated',   label: 'Escalated',   icon: <AlertCircle size={13} /> },
  ].filter(t => t.key === 'all' || counts[t.key] > 0);

  const trendColor = reportData.trend.direction === 'increasing' ? '#DC2626'
    : reportData.trend.direction === 'decreasing' ? '#16A34A' : '#6b7280';

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className={`${card} p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Weekly Performance Report</h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar size={14} />
            {(() => {
              const end = new Date(reportData.week_ending);
              const start = new Date(end);
              start.setDate(end.getDate() - 6);
              const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              return `Week: ${fmt(start)} – ${fmt(end)}`;
            })()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            disabled={!reportData?.top_priority_students?.length}
            className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded text-sm hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => fetchReport(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',  value: reportData.statistics.total_students,    icon: <Users size={20} className="text-gray-500" />,    sub: 'Enrolled in your classroom' },
          { label: 'Critical Risk',   value: reportData.statistics.critical_count,    icon: <AlertCircle size={20} className="text-red-600" />, sub: 'Risk score ≥75 (attendance <50%)' },
          { label: 'High Risk',       value: reportData.statistics.high_count,        icon: <TrendingUp size={20} className="text-yellow-600" />,sub: 'Risk score 50–74 (attendance 50–74%)' },
          { label: 'Avg Risk Score',  value: reportData.statistics.average_risk_score,icon: <BarChart3 size={20} className="text-gray-500" />,  sub: 'Across all students (0–100 scale)' },
        ].map(({ label, value, icon, sub }) => (
          <div key={label} className={`${card} p-4`}>
            <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-gray-500">{label}</p></div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Case Status Overview */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" /> Case Status Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Open',            value: reportData.cases_by_status?.open || 0,        dot: 'bg-red-600' },
            { label: 'In Progress',     value: reportData.cases_by_status?.in_progress || 0, dot: 'bg-yellow-600' },
            { label: 'Under Monitoring',value: reportData.cases_by_status?.monitoring || 0,  dot: 'bg-gray-400' },
            { label: 'Closed',          value: reportData.cases_by_status?.closed || 0,      dot: 'bg-green-700' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle size={14} className="text-green-500" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.cases_closed_this_week || 0}</strong> closed this week</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={14} className="text-gray-400" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.students_under_monitoring || 0}</strong> under monitoring</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle size={14} className="text-red-400" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.overdue_followups || 0}</strong> overdue follow-ups</span>
          </div>
        </div>
      </div>

      {/* Activity This Week */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-gray-400" /> Your Activity This Week
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Cases Created',      value: reportData.activity_summary?.cases_created || 0,      icon: <FileText size={20} className="text-gray-500" /> },
            { label: 'Students Contacted', value: reportData.activity_summary?.students_contacted || 0, icon: <UserCheck size={20} className="text-green-600" /> },
            { label: 'Meetings Scheduled', value: reportData.activity_summary?.meetings_scheduled || 0, icon: <Users size={20} className="text-gray-500" /> },
            { label: 'Follow-ups Planned', value: reportData.activity_summary?.followups_planned || 0,  icon: <Clock size={20} className="text-yellow-600" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-xs text-gray-500">{label}</p></div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle size={14} className="text-green-500" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.students_improving || 0}</strong> students improving</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle size={14} className="text-red-400" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.students_not_improving || 0}</strong> need more support</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText size={14} className="text-gray-400" />
            <span><strong className="text-gray-800">{reportData.activity_summary?.total_active_cases || 0}</strong> active cases</span>
          </div>
        </div>
      </div>

      {/* Charts: Case Status Distribution + Absence Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" /> Case Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Open',        value: reportData.cases_by_status?.open || 0,        fill: '#DC2626' },
                  { name: 'In Progress', value: reportData.cases_by_status?.in_progress || 0, fill: '#D97706' },
                  { name: 'Monitoring',  value: reportData.cases_by_status?.monitoring || 0,  fill: '#9ca3af' },
                  { name: 'Closed',      value: reportData.cases_by_status?.closed || 0,      fill: '#16A34A' },
                ]}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
              />
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { label: 'Open', color: 'bg-red-600' },
              { label: 'In Progress', color: 'bg-yellow-600' },
              { label: 'Monitoring', color: 'bg-gray-400' },
              { label: 'Closed', color: 'bg-green-700' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-400" /> Absence Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { week: 'Last Week', absences: reportData.trend.last_week_absences },
                { week: 'This Week', absences: reportData.trend.this_week_absences },
              ]}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
              <Bar dataKey="absences" radius={[4, 4, 0, 0]} barSize={60}>
                <Cell fill="#9ca3af" />
                <Cell fill={trendColor} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={`mt-3 p-3 rounded-lg border-l-4 text-sm ${
            reportData.trend.direction === 'increasing' ? 'border-red-300 text-red-700' :
            reportData.trend.direction === 'decreasing' ? 'border-green-400 text-green-700' :
            'border-gray-300 text-gray-600'
          }`} style={{
            backgroundColor: reportData.trend.direction === 'increasing' ? '#FEF2F2' :
              reportData.trend.direction === 'decreasing' ? '#F0FDF4' : '#F9FAFB',
            border: reportData.trend.direction === 'increasing' ? '1px solid #FECACA' :
              reportData.trend.direction === 'decreasing' ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
            borderLeftWidth: '4px',
            borderLeftColor: reportData.trend.direction === 'increasing' ? '#FCA5A5' :
              reportData.trend.direction === 'decreasing' ? '#86EFAC' : '#D1D5DB',
          }}>
            <span className="font-medium">
              {reportData.trend.direction === 'increasing' && 'Absences increasing — '}
              {reportData.trend.direction === 'decreasing' && 'Absences decreasing — '}
              {reportData.trend.direction === 'stable' && 'Absences stable — '}
            </span>
            {reportData.trend.this_week_absences} this week
            <span className="ml-1">
              ({reportData.trend.change > 0 ? '+' : ''}{reportData.trend.change} from last week)
            </span>
          </div>
        </div>
      </div>

      {/* Top 10 Priority Students */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Top 10 Priority Students</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Recommendations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.top_priority_students.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-[14px] text-sm font-semibold text-gray-500">#{index + 1}</td>
                  <td className="px-4 py-[14px]">
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.student_id}</p>
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      student.risk_score >= 75 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {student.risk_score}
                    </span>
                  </td>
                  <td className="px-4 py-[14px] hidden md:table-cell">
                    <ul className="space-y-0.5">
                      {student.recommendations?.slice(0, 2).map((rec, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-gray-300 mt-0.5">•</span>{rec.action}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Actions This Week */}
      {allActions.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" /> Student Actions This Week
          </h3>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterTabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActionFilter(key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                  actionFilter === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {icon}{label} ({counts[key]})
              </button>
            ))}
          </div>

          {/* Actions Table */}
          <div className="overflow-x-auto">
            {filteredActions.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">No actions found for this filter.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Student', 'ID', 'Case #', 'Action', 'Details', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredActions.map((item, idx) => {
                    const days = Math.floor((new Date() - item.action_date) / 86400000);
                    const timeLabel = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days <= 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-[14px]">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">
                              {item.student_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{item.student_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-[14px] text-xs text-gray-500">{item.student_id}</td>
                        <td className="px-4 py-[14px]">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">#{item.case_id}</span>
                        </td>
                        <td className="px-4 py-[14px]">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${actionBadgeStyle(item.action_type)}`}>
                            {item.action_type === 'case_created'      && <FileText size={11} />}
                            {item.action_type === 'meeting_scheduled' && <Users size={11} />}
                            {item.action_type === 'followup_planned'  && <Clock size={11} />}
                            {item.action_type === 'progress_update'   && <Activity size={11} />}
                            {item.action_type === 'case_closed'       && <CheckCircle size={11} />}
                            {item.action_type === 'case_escalated'    && <AlertCircle size={11} />}
                            {item.action_label}
                          </span>
                        </td>
                        <td className="px-4 py-[14px] text-xs text-gray-600">{item.action_details}</td>
                        <td className="px-4 py-[14px]">
                          <p className="text-xs font-medium text-gray-700">{timeLabel}</p>
                          <p className="text-xs text-gray-400">{item.action_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* System Recommendations */}
      <div className={`${card} p-5`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">System Recommendations</h3>
        <p className="text-xs text-gray-400 mb-3">Rule-based — each recommendation is triggered automatically when a threshold is met.</p>
        <div className="space-y-3">
          {reportData.recommendations.map((rec, i) => (
            <div key={i} className={`border-l-4 rounded-r-lg p-4 ${getPriorityStyle(rec.priority)}`}>
              <div className="flex items-start gap-3">
                {rec.priority === 'URGENT' || rec.priority === 'HIGH'
                  ? <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  : <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1">{rec.priority} Priority</p>
                  <p className="text-sm mb-1">{rec.message}</p>
                  <p className="text-xs font-medium">Action: {rec.action}</p>
                  {rec.trigger && (
                    <p className="text-xs text-gray-400 mt-1 italic">Triggered: {rec.trigger}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default WeeklyReportPanel;
