import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Target, Users, BarChart3,
  AlertCircle, CheckCircle, Clock, RefreshCw, Lightbulb,
  AlertTriangle, PhoneCall, ArrowRight
} from 'lucide-react';
import api from '../api/apiClient';
import { showToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';

const card = 'bg-white border border-gray-200 rounded-lg shadow-sm';

const PROGRESS_CONFIG = {
  improving:     { label: 'Improving',      badgeCls: 'bg-green-100 text-green-700 border-green-200'  },
  resolved:      { label: 'Resolved',       badgeCls: 'bg-green-100 text-green-700 border-green-200'  },
  contacted:     { label: 'Contacted',      badgeCls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  no_contact:    { label: 'No Contact Yet', badgeCls: 'bg-red-100 text-red-700 border-red-200'        },
  not_improving: { label: 'Not Improving',  badgeCls: 'bg-red-100 text-red-700 border-red-200'        },
};

export default function ProgressDashboard() {
  const [loading, setLoading]             = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [openCases, setOpenCases]         = useState([]);
  const [error, setError]                 = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, casesRes] = await Promise.all([
        api.get('/interventions/progress/dashboard/'),
        api.get('/interventions/'),
      ]);
      setDashboardData(progressRes.data);
      const all = Array.isArray(casesRes.data) ? casesRes.data : casesRes.data.results || [];
      const open = all
        .filter(c => c.status !== 'closed')
        .map(c => ({ ...c, daysOpen: Math.floor((Date.now() - new Date(c.created_at)) / 86400000) }))
        .sort((a, b) => b.daysOpen - a.daysOpen);
      setOpenCases(open);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load progress data';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="h-40 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-l-4 border-red-400 bg-red-50 rounded-lg p-5 flex items-start gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-red-800 mb-1">Failed to load progress data</p>
          <p className="text-xs text-red-700 mb-3">{error}</p>
          <button onClick={fetchAll} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { intervention_effectiveness, patterns, top_improving_students, students_needing_attention } = dashboardData;
  const stats    = intervention_effectiveness.overall_stats;
  const byStatus = intervention_effectiveness.by_progress_status;

  const noContactCount  = byStatus.find(s => s.status === 'no_contact')?.count    || 0;
  const contactedCount  = byStatus.find(s => s.status === 'contacted')?.count     || 0;
  const improvingCount  = (byStatus.find(s => s.status === 'improving')?.count    || 0)
                        + (byStatus.find(s => s.status === 'resolved')?.count     || 0);
  const noContactPct    = stats.total_cases > 0 ? Math.round(noContactCount  / stats.total_cases * 100) : 0;
  const contactedPct    = stats.total_cases > 0 ? Math.round(contactedCount  / stats.total_cases * 100) : 0;
  const improvingPct    = stats.total_cases > 0 ? Math.round(improvingCount  / stats.total_cases * 100) : 0;

  const avgDaysOpen  = openCases.length
    ? Math.round(openCases.reduce((s, c) => s + c.daysOpen, 0) / openCases.length) : 0;
  const overdueCount = openCases.filter(c => c.daysOpen > 14).length;

  // Build insights from real data
  const insights = [];
  if (noContactPct > 0)   insights.push(`${noContactPct}% of cases have had no contact yet`);
  if (overdueCount > 0)   insights.push(`${overdueCount} case${overdueCount > 1 ? 's are' : ' is'} overdue (open more than 14 days)`);
  if (improvingPct > 0)   insights.push(`${improvingPct}% of students are showing improvement`);
  if (avgDaysOpen > 7)    insights.push(`Average case is open for ${avgDaysOpen} days — early follow-up improves outcomes`);
  if (insights.length === 0) insights.push('No cases yet — create intervention cases to see insights here');

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Intervention Performance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor student support progress and outcomes</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Cases',
            value: stats.total_cases,
            icon: <BarChart3 size={16} className="text-gray-500" />,
            valueColor: 'text-gray-900',
          },
          {
            label: 'Improving',
            value: improvingCount,
            icon: <TrendingUp size={16} className="text-green-600" />,
            valueColor: 'text-green-700',
          },
          {
            label: 'Avg Days Open',
            value: `${avgDaysOpen}d`,
            icon: <Clock size={16} className="text-yellow-500" />,
            valueColor: overdueCount > 0 ? 'text-orange-600' : 'text-yellow-600',
          },
          {
            label: 'No Contact Yet',
            value: noContactCount,
            icon: <AlertTriangle size={16} className={noContactCount > 0 ? 'text-red-500' : 'text-gray-400'} />,
            valueColor: noContactCount > 0 ? 'text-red-600' : 'text-gray-500',
          },
        ].map(kpi => (
          <div key={kpi.label} className={`${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              {kpi.icon}
              <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.valueColor}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Status Overview + Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status Overview — compact cards */}
        <div className={card}>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Status Overview</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.total_cases} total cases</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              {
                label: 'No Contact Yet',
                count: noContactCount,
                pct: noContactPct,
                badgeCls: 'bg-red-100 text-red-700 border border-red-200',
                rowCls: 'bg-red-50',
              },
              {
                label: 'Contacted',
                count: contactedCount,
                pct: contactedPct,
                badgeCls: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
                rowCls: 'bg-yellow-50',
              },
              {
                label: 'Improving',
                count: improvingCount,
                pct: improvingPct,
                badgeCls: 'bg-green-100 text-green-700 border border-green-200',
                rowCls: 'bg-green-50',
              },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between px-4 py-3 rounded-lg ${s.rowCls}`}>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badgeCls}`}>
                  {s.label}
                </span>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900">{s.count}</span>
                  <span className="text-xs text-gray-400 ml-1.5">{s.pct}%</span>
                </div>
              </div>
            ))}
            {stats.total_cases === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No cases yet</p>
            )}
          </div>
        </div>

        {/* Key Insights */}
        <div className={card}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Lightbulb size={15} className="text-yellow-500" />
            <p className="text-sm font-semibold text-gray-800">Key Insights</p>
          </div>
          <div className="p-5 space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recommended Focus ── */}
      <div className={card}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Target size={15} className="text-green-600" />
          <p className="text-sm font-semibold text-gray-800">Recommended Focus</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            {
              action: 'Contact pending students immediately',
              detail: `${noContactCount} case${noContactCount !== 1 ? 's' : ''} with no contact yet`,
              show: noContactCount > 0,
            },
            {
              action: 'Prioritise critical-risk overdue cases',
              detail: `${overdueCount} case${overdueCount !== 1 ? 's' : ''} open more than 14 days`,
              show: overdueCount > 0,
            },
            {
              action: 'Schedule follow-up meetings',
              detail: 'Regular check-ins improve student outcomes significantly',
              show: true,
            },
          ].filter(a => a.show).map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-start gap-2.5">
                <ArrowRight size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.detail}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/form-master')}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                View Cases
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Open Cases Table ── */}
      {openCases.length > 0 && (
        <div className={card}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Open Cases — Action Required</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {openCases.length} open &nbsp;·&nbsp;
                {overdueCount > 0
                  ? <span className="text-red-600 font-medium">{overdueCount} overdue (&gt;14 days)</span>
                  : 'none overdue'}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Status', 'Progress', 'Days Open'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {openCases.map(c => {
                  const cfg = PROGRESS_CONFIG[c.progress_status] || { label: 'No Contact', badgeCls: 'bg-gray-100 text-gray-600 border-gray-200' };
                  const isOverdue = c.daysOpen > 14;
                  return (
                    <tr key={c.case_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{c.student__full_name || `Student #${c.student}`}</p>
                        <p className="text-xs text-gray-400">Case #{c.case_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                          c.status === 'escalated_to_admin' ? 'bg-red-50 text-red-700 border-red-200' :
                          c.status === 'in_progress'        ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {c.status === 'escalated_to_admin' ? 'Escalated'
                            : c.status?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${cfg.badgeCls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {c.daysOpen}d
                          {isOverdue && <span className="ml-1 text-xs font-normal text-red-400">overdue</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Improving Students ── */}
      {top_improving_students.length > 0 && (
        <div className={card}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingDown size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-gray-800">Top Improving Students</p>
          </div>
          <div className="divide-y divide-gray-100">
            {top_improving_students.map((s, i) => (
              <div key={s.student_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.updated_at}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                    s.current_risk >= 75 ? 'bg-red-50 text-red-700 border-red-200' :
                    s.current_risk >= 50 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    s.current_risk >= 25 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    Risk {s.current_risk}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {s.progress_status === 'resolved' ? 'Resolved' : 'Improving'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Declining Students ── */}
      {students_needing_attention.length > 0 && (
        <div className={card}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <PhoneCall size={15} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-800">Needs Immediate Attention</p>
          </div>
          <div className="divide-y divide-gray-100">
            {students_needing_attention.map((s, i) => (
              <div key={s.student_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.days_open}d open{s.days_open > 14 ? ' — overdue' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                    s.current_risk >= 75 ? 'bg-red-50 text-red-700 border-red-200' :
                    s.current_risk >= 50 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    Risk {s.current_risk}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {s.progress_status === 'not_improving' ? 'Not Improving' : 'No Contact'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {stats.total_cases === 0 && openCases.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <Users className="mx-auto text-gray-300 mb-4" size={40} />
          <p className="text-sm font-semibold text-gray-600 mb-1">No intervention cases yet</p>
          <p className="text-xs text-gray-400">Progress data will appear here once cases are created and updated.</p>
        </div>
      )}
    </div>
  );
}
