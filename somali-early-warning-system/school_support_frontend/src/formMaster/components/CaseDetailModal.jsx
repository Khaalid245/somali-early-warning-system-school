import { useState } from 'react';
import { X, User, Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../api/apiClient';
import { showToast } from '../../utils/toast';

const STATUS_SEGMENTS = [
  { value: 'open',               label: 'Open',            active: 'bg-blue-600 text-white' },
  { value: 'in_progress',        label: 'In Progress',     active: 'bg-yellow-500 text-white' },
  { value: 'awaiting_parent',    label: 'Awaiting Parent', active: 'bg-yellow-600 text-white' },
  { value: 'escalated_to_admin', label: 'Escalated',       active: 'bg-red-600 text-white' },
  { value: 'closed',             label: 'Closed',          active: 'bg-green-600 text-white' },
];

const PROGRESS_OPTIONS = [
  { value: 'no_contact',    label: 'No Contact Yet' },
  { value: 'contacted',     label: 'Student Contacted' },
  { value: 'improving',     label: 'Showing Improvement' },
  { value: 'not_improving', label: 'Not Improving' },
  { value: 'resolved',      label: 'Issue Resolved' },
];

// System palette — matches dashboard
const STATUS_BADGE = {
  open:               'bg-blue-50 text-blue-700',
  in_progress:        'bg-yellow-50 text-yellow-700',
  awaiting_parent:    'bg-yellow-50 text-yellow-700',
  escalated_to_admin: 'bg-red-50 text-red-700',
  closed:             'bg-green-50 text-green-700',
};

const PRIORITY_BADGE = {
  critical: 'bg-red-50 text-red-700',
  high:     'bg-red-50 text-red-600',
  medium:   'bg-yellow-50 text-yellow-700',
  low:      'bg-gray-100 text-gray-500',
};

export default function CaseDetailModal({ caseItem, onClose, onUpdated }) {
  const [status,          setStatus]     = useState(caseItem.status);
  const [progress,        setProgress]   = useState(caseItem.progress_status || 'no_contact');
  const [meetingNotes,    setMeeting]    = useState(caseItem.meeting_notes    || '');
  const [resolutionNotes, setResolution] = useState(caseItem.resolution_notes || '');
  const [saving,          setSaving]     = useState(false);

  const isClosed  = status === 'closed';
  const days      = Math.max(1, Math.ceil((Date.now() - new Date(caseItem.created_at)) / 86400000));
  const isOverdue = days > 14 && caseItem.status !== 'closed';

  const rLevel  = (caseItem.student_risk_level || caseItem.risk_level)?.toLowerCase();
  const pBadge  = PRIORITY_BADGE[rLevel] || PRIORITY_BADGE.low;
  const pLabel  = rLevel ? rLevel.charAt(0).toUpperCase() + rLevel.slice(1) : null;
  const sBadge  = STATUS_BADGE[caseItem.status] || 'bg-gray-100 text-gray-600';

  const handleSave = async () => {
    if (isClosed && !resolutionNotes.trim()) {
      showToast.error('Resolution notes are required to close a case.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/interventions/${caseItem.case_id}/`, {
        status,
        progress_status:  progress,
        meeting_notes:    meetingNotes    || undefined,
        resolution_notes: resolutionNotes || undefined,
        version:          caseItem.version,
      });
      showToast.success('Case updated');
      onUpdated();
    } catch (err) {
      showToast.error(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Failed to update case'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">
                  {caseItem.student_name || caseItem.student__full_name}
                </p>
                {caseItem.classroom && caseItem.classroom !== 'Not Enrolled' && (
                  <p className="text-xs text-gray-400 mt-0.5">{caseItem.classroom}</p>
                )}
                {/* 2 badges max + meta */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sBadge}`}>
                    {STATUS_SEGMENTS.find(s => s.value === caseItem.status)?.label || caseItem.status}
                  </span>
                  {pLabel && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pBadge}`}>
                      {pLabel}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Case #{caseItem.case_id}</span>
                  <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    · {days} day{days !== 1 ? 's' : ''} open{isOverdue ? ' · Overdue' : ''}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Escalation reason */}
          {caseItem.escalation_reason && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Escalation Reason
              </p>
              <p className="text-xs text-red-800 leading-relaxed">
                {caseItem.escalation_reason}
              </p>
            </div>
          )}

          {/* Initial observation */}
          {caseItem.outcome_notes && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Initial Observation
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {caseItem.outcome_notes}
              </p>
            </div>
          )}

          {/* Attendance snapshot */}
          {(caseItem.attendance_rate_at_open != null || caseItem.attendance_rate_at_close != null) && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-4 text-xs">
              <span className="text-gray-500 font-medium">Attendance snapshot</span>
              <span className="text-gray-700">
                At open: <span className="font-semibold text-gray-900">{caseItem.attendance_rate_at_open != null ? `${caseItem.attendance_rate_at_open}%` : '—'}</span>
              </span>
              {caseItem.attendance_rate_at_close != null && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">
                    At close: <span className={`font-semibold ${
                      parseFloat(caseItem.attendance_rate_at_close) > parseFloat(caseItem.attendance_rate_at_open)
                        ? 'text-green-600' : 'text-red-600'
                    }`}>{caseItem.attendance_rate_at_close}%</span>
                  </span>
                </>
              )}
            </div>
          )}

          {/* Follow-up date */}
          {caseItem.follow_up_date && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">Follow-up:</span>
              <span className={`font-medium ${
                new Date(caseItem.follow_up_date) < new Date() && caseItem.status !== 'closed'
                  ? 'text-red-600' : 'text-gray-700'
              }`}>
                {new Date(caseItem.follow_up_date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Case Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Case Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_SEGMENTS.map(seg => (
                <button
                  key={seg.value}
                  type="button"
                  onClick={() => setStatus(seg.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    status === seg.value
                      ? `${seg.active} border-transparent`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Progress
            </label>
            <select
              value={progress}
              onChange={e => setProgress(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              {PROGRESS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">
              Meeting Notes
              <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={meetingNotes}
              onChange={e => setMeeting(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What was discussed in the most recent meeting…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {meetingNotes.length}/2000
            </p>
          </div>

          {/* Resolution Notes — only when closing */}
          {isClosed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">
                Resolution Notes
                <span className="ml-1 text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(required to close)</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={e => setResolution(e.target.value)}
                rows={3}
                placeholder="Describe how this case was resolved…"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none placeholder-gray-400"
              />
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving
              ? 'Saving…'
              : <><CheckCircle className="w-4 h-4" /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
