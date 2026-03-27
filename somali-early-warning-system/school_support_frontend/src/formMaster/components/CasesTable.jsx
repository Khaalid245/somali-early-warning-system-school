import { useState, useMemo } from 'react';
import { ClipboardList, ChevronRight, AlertCircle } from 'lucide-react';
import CaseDetailModal from './CaseDetailModal';

const STATUS_TABS = [
  { key: 'all',                label: 'All' },
  { key: 'open',               label: 'Open' },
  { key: 'in_progress',        label: 'In Progress' },
  { key: 'escalated_to_admin', label: 'Escalated' },
  { key: 'closed',             label: 'Closed' },
];

// System color palette — matches dashboard badges
const STATUS_BADGE = {
  open:                { cls: 'bg-blue-50 text-blue-700',     label: 'Open' },
  in_progress:         { cls: 'bg-yellow-50 text-yellow-700', label: 'In Progress' },
  awaiting_parent:     { cls: 'bg-yellow-50 text-yellow-700', label: 'Awaiting Parent' },
  escalated_to_admin:  { cls: 'bg-red-50 text-red-700',       label: 'Escalated' },
  closed:              { cls: 'bg-green-50 text-green-700',    label: 'Closed' },
};

const PRIORITY_BADGE = {
  critical: { cls: 'bg-red-50 text-red-700',      label: 'Critical' },
  high:     { cls: 'bg-red-50 text-red-600',       label: 'High' },
  medium:   { cls: 'bg-yellow-50 text-yellow-700', label: 'Medium' },
  low:      { cls: 'bg-gray-100 text-gray-500',    label: 'Low' },
};

const PROGRESS_LABEL = {
  no_contact:    'No contact yet',
  contacted:     'Student contacted',
  improving:     'Showing improvement',
  not_improving: 'Not improving',
  resolved:      'Resolved',
};

const daysOpen = (createdAt) =>
  Math.max(1, Math.ceil((Date.now() - new Date(createdAt)) / 86400000));

export default function CasesTable({ cases, onRefresh }) {
  const [tab, setTab]           = useState('all');
  const [selectedCase, setCase] = useState(null);
  const [dateFrom, setFrom]     = useState('');
  const [dateTo, setTo]         = useState('');

  const filtered = useMemo(() => {
    return (cases || []).filter(c => {
      if (tab !== 'all' && c.status !== tab) return false;
      const created = new Date(c.created_at);
      if (dateFrom && created < new Date(dateFrom)) return false;
      if (dateTo   && created > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [cases, tab, dateFrom, dateTo]);

  const counts = useMemo(() => STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? (cases || []).length
      : (cases || []).filter(c => c.status === t.key).length;
    return acc;
  }, {}), [cases]);

  if (!cases || cases.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">No intervention cases</p>
        <p className="text-xs text-gray-400 mt-1">
          Cases are created when alerts are reviewed or escalated.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
        {STATUS_TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? t.key === 'escalated_to_admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`ml-1.5 ${active ? 'opacity-70' : 'text-gray-400'}`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          );
        })}

        {/* Date filter */}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setFrom(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setTo(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setFrom(''); setTo(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          No cases match the current filter.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map(c => {
            const days    = daysOpen(c.created_at);
            const overdue = days > 14 && c.status !== 'closed';
            const sBadge  = STATUS_BADGE[c.status] || { cls: 'bg-gray-100 text-gray-600', label: c.status };
            const rLevel  = (c.student_risk_level || c.risk_level)?.toLowerCase();
            const pBadge  = PRIORITY_BADGE[rLevel] || PRIORITY_BADGE.low;
            const progress = c.progress_status && c.progress_status !== 'no_contact'
              ? PROGRESS_LABEL[c.progress_status] || c.progress_status
              : null;

            return (
              <div
                key={c.case_id}
                className="flex items-center gap-4 px-6 py-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => setCase(c)}
              >
                {/* Student info */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Row 1: name + 2 badges max */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {c.student_name || c.student__full_name}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sBadge.cls}`}>
                      {sBadge.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pBadge.cls}`}>
                      {pBadge.label}
                    </span>
                  </div>

                  {/* Row 2: class · case id · days · overdue */}
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    {c.classroom && c.classroom !== 'Not Enrolled' && (
                      <span>{c.classroom} ·</span>
                    )}
                    <span>Case #{c.case_id}</span>
                    <span>· {days} day{days !== 1 ? 's' : ''} open</span>
                    {overdue && (
                      <span className="flex items-center gap-0.5 text-red-500 font-medium">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </p>

                  {/* Row 3: progress (only if meaningful) */}
                  {progress && (
                    <p className="text-xs text-gray-500">{progress}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'open' && (
                    <button
                      onClick={e => { e.stopPropagation(); setCase(c); }}
                      className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Update
                    </button>
                  )}
                  {c.status === 'in_progress' && (
                    <button
                      onClick={e => { e.stopPropagation(); setCase(c); }}
                      className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Update
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCase && (
        <CaseDetailModal
          caseItem={selectedCase}
          onClose={() => setCase(null)}
          onUpdated={() => { setCase(null); onRefresh?.(); }}
        />
      )}
    </>
  );
}
