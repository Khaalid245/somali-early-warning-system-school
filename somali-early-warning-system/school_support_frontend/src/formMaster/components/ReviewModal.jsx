import { useState } from 'react';
import { X, User, AlertTriangle, Calendar } from 'lucide-react';

const URGENCY = [
  { value: 'low',    label: 'Low',    active: 'bg-green-600 text-white border-green-600',    idle: 'text-green-700 border-green-200 hover:bg-green-50' },
  { value: 'medium', label: 'Medium', active: 'bg-yellow-500 text-white border-yellow-500',  idle: 'text-yellow-700 border-yellow-200 hover:bg-yellow-50' },
  { value: 'high',   label: 'High',   active: 'bg-red-600 text-white border-red-600',        idle: 'text-red-700 border-red-200 hover:bg-red-50' },
];

export default function ReviewModal({ alert, onConfirm, onClose, isSubmitting }) {
  const [observation, setObservation] = useState('');
  const [urgency, setUrgency]         = useState('medium');
  const [followUp, setFollowUp]       = useState('');
  const [error, setError]             = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!observation.trim()) { setError('Please describe your initial observation.'); return; }
    setError('');
    onConfirm({ observation: observation.trim(), urgency, followUp });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Begin Review</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Student Info ─────────────────────────────────────────── */}
        <div className="mx-6 mt-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{alert.student_name}</p>
              {alert.classroom_name && alert.classroom_name !== 'Not Enrolled' && (
                <p className="text-xs text-gray-500 mt-0.5">{alert.classroom_name}</p>
              )}
              {/* Issue summary */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {alert.days_missed > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {alert.days_missed} absences in 30 days
                  </span>
                )}
                {alert.consecutive_absences > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    {alert.consecutive_absences} consecutive days
                  </span>
                )}
              </div>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
              alert.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
              alert.risk_level === 'high'     ? 'bg-orange-100 text-orange-700' :
              alert.risk_level === 'medium'   ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
            }`}>
              {alert.risk_level?.charAt(0).toUpperCase() + alert.risk_level?.slice(1)}
            </span>
          </div>
        </div>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Observation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Observation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={observation}
              onChange={e => { setObservation(e.target.value); setError(''); }}
              rows={4}
              placeholder="Describe what you observed — attendance pattern, student behaviour, context from teachers, any known circumstances…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none placeholder-gray-400"
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                    urgency === opt.value ? opt.active : `bg-white ${opt.idle}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Follow-up Date
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={followUp}
              min={minDate}
              onChange={e => setFollowUp(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving…' : 'Begin Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
