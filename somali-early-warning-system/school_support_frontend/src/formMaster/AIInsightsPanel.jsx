import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Activity, CheckCircle, Calendar, User, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

const PAGE_SIZE = 10;

const RISK_CONFIG = {
  critical: { label: 'Critical', badge: 'bg-red-50 text-red-700 border border-red-200',     dot: 'bg-red-500',    icon: AlertCircle  },
  high:     { label: 'High',     badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400',  icon: AlertTriangle },
  moderate: { label: 'Moderate', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400', icon: Activity     },
  low:      { label: 'Low',      badge: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500',  icon: CheckCircle  },
};

const SUMMARY_CARDS = [
  { key: 'critical', label: 'Critical', border: 'border-l-red-400',    icon: AlertCircle,   iconColor: 'text-red-500'    },
  { key: 'high',     label: 'High',     border: 'border-l-amber-400',  icon: AlertTriangle, iconColor: 'text-amber-500'  },
  { key: 'moderate', label: 'Moderate', border: 'border-l-yellow-400', icon: Activity,      iconColor: 'text-yellow-500' },
  { key: 'low',      label: 'Low',      border: 'border-l-green-400',  icon: CheckCircle,   iconColor: 'text-green-600'  },
];

function ListRow({ insight, index, expandedIndex, onToggle }) {
  const expanded = expandedIndex === index;
  const level = insight.risk_analysis?.risk_level || 'low';
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  const score = insight.risk_analysis?.risk_score ?? '—';
  const rate = insight.risk_analysis?.attendance_rate;
  const absences = insight.risk_analysis?.absent_count;
  const recs = insight.recommendations || [];
  const primaryRec = recs[0];

  // Max 2 key issue pills
  const keyIssues = [];
  if (rate != null)     keyIssues.push(`${rate}% attendance`);
  if (absences != null) keyIssues.push(`${absences} absences`);

  return (
    <>
      <tr
        className={`border-b border-gray-100 transition-colors ${
          expanded ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
      >
        {/* # */}
        <td className="px-3 py-2.5 text-xs text-gray-400 w-8 tabular-nums">{index + 1}</td>

        {/* Student */}
        <td className="px-3 py-2.5 min-w-[140px]">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            <div>
              <p className="text-sm font-medium text-gray-900 leading-tight">{insight.student_name}</p>
              <p className="text-xs text-gray-400">ID: {insight.student_id}</p>
            </div>
          </div>
        </td>

        {/* Risk */}
        <td className="px-3 py-2.5 w-24">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
        </td>

        {/* Score */}
        <td className="px-3 py-2.5 w-14 text-center">
          <span className="text-sm font-semibold text-gray-700">{score}</span>
        </td>

        {/* Key Issues — max 2 pills */}
        <td className="px-3 py-2.5 hidden sm:table-cell">
          <div className="flex flex-wrap gap-1">
            {keyIssues.slice(0, 2).map((issue, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                {issue}
              </span>
            ))}
          </div>
        </td>

        {/* Action — soft small button */}
        <td className="px-3 py-2.5 w-28 hidden md:table-cell">
          <div className="flex flex-col items-start gap-0.5">
            <button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1 rounded-md transition-colors whitespace-nowrap">
              <Calendar size={11} />
              Schedule
            </button>
            {primaryRec?.success_rate && (
              <span className="text-xs text-gray-400 pl-0.5">{primaryRec.success_rate} success</span>
            )}
          </div>
        </td>

        {/* Expand toggle */}
        <td className="px-3 py-2.5 w-8 text-right">
          <button
            onClick={() => onToggle(index)}
            className="text-gray-300 hover:text-gray-500 transition-colors"
            title={expanded ? 'Collapse' : 'View details'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>

      {/* Expanded detail — single primary recommendation only */}
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={7} className="px-5 py-3">
            {/* Mobile: show issues + action */}
            <div className="flex flex-wrap gap-1 sm:hidden mb-2">
              {keyIssues.map((issue, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{issue}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 md:hidden mb-3">
              <button className="flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                <Calendar size={11} /> Schedule
              </button>
              {primaryRec?.success_rate && (
                <span className="text-xs text-gray-400">{primaryRec.success_rate} success</span>
              )}
            </div>

            {primaryRec ? (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Next steps</p>
                <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
                  {(primaryRec.steps?.slice(0, 3) || [
                    primaryRec.action || 'Meet with student',
                    'Contact parent or guardian',
                    'Monitor attendance next 7 days'
                  ]).map((step, si) => <li key={si}>{step}</li>)}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No follow-up steps available.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AIInsightsPanel({ aiInsights, classroomSummary }) {
  const dist = classroomSummary?.risk_distribution || {};
  const [page, setPage] = useState(1);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => { setPage(1); setExpandedIndex(null); }, [aiInsights]);

  const totalPages = Math.ceil((aiInsights?.length || 0) / PAGE_SIZE);
  const paginated = (aiInsights || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Only one row open at a time
  const handleToggle = (index) => setExpandedIndex(prev => prev === index ? null : index);

  // Reset expanded row on page change
  const handlePageChange = (n) => { setPage(n); setExpandedIndex(null); };

  if (!aiInsights || aiInsights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <Lightbulb size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No insights available yet.</p>
        <p className="text-sm text-gray-400 mt-1">Add students to see recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-medium text-gray-800">Students Needing Attention</h2>
        <p className="text-sm text-gray-400 mt-0.5">Students who may need follow-up based on recent attendance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUMMARY_CARDS.map(({ key, label, border, icon: Icon, iconColor }) => (
          <div key={key} className={`bg-white rounded-lg border border-gray-200 border-l-4 ${border} p-3`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <Icon size={14} className={iconColor} />
            </div>
            <p className="text-2xl font-semibold text-gray-800">{dist[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            Students at Risk
          </p>
          <span className="text-xs text-gray-400">{aiInsights.length} student{aiInsights.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-3 py-2 text-xs font-medium text-gray-400 w-8">#</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400">Student</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 w-24">Risk</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 w-14 text-center">Score</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Key Issues</th>
                <th className="px-3 py-2 text-xs font-medium text-gray-400 w-28 hidden md:table-cell">Action</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((insight, i) => (
                <ListRow
                  key={i}
                  insight={insight}
                  index={(page - 1) * PAGE_SIZE + i}
                  expandedIndex={expandedIndex}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, aiInsights.length)} of {aiInsights.length} students
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => handlePageChange(n)}
                  className={`w-7 h-7 text-xs rounded-md border transition-colors ${
                    n === page
                      ? 'bg-green-600 text-white border-green-600 font-semibold'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 px-1">Based on recent attendance patterns.</p>
    </div>
  );
}
