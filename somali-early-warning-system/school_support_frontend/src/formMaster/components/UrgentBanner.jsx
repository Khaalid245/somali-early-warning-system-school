import { AlertTriangle } from 'lucide-react';

export default function UrgentBanner({ data }) {
  if (!data) return null;

  const { overdue_cases, immediate_attention, classroom_stats } = data;
  const criticalClassrooms = classroom_stats?.filter(c => c.health_status === 'critical').length || 0;
  const urgentCount = (immediate_attention?.length || 0) + (overdue_cases || 0);

  if (urgentCount === 0 && criticalClassrooms === 0) return null;

  const today = new Date();
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-red-400 rounded-lg px-5 py-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-gray-800">Urgent Attention Required</p>
            <span className="text-xs text-gray-400">As of {fmt(today)}</span>
          </div>
          <div className="space-y-1">
            {immediate_attention?.length > 0 && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{immediate_attention.length}</span> student{immediate_attention.length !== 1 ? 's' : ''} need immediate intervention
                <span className="text-gray-400 ml-1">(risk score ≥75, no active case)</span>
              </p>
            )}
            {overdue_cases > 0 && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{overdue_cases}</span> case{overdue_cases !== 1 ? 's' : ''} overdue for follow-up
                <span className="text-gray-400 ml-1">(open &gt;14 days without update)</span>
              </p>
            )}
            {criticalClassrooms > 0 && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{criticalClassrooms}</span> classroom{criticalClassrooms !== 1 ? 's' : ''} in critical risk status
                <span className="text-gray-400 ml-1">(attendance &lt;60%)</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
