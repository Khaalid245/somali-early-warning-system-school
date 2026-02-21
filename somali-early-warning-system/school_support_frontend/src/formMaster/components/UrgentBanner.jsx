export default function UrgentBanner({ data }) {
  if (!data) return null;

  const { overdue_cases, immediate_attention, classroom_stats } = data;
  
  const criticalClassrooms = classroom_stats?.filter(c => c.health_status === 'critical').length || 0;
  const urgentCount = (immediate_attention?.length || 0) + (overdue_cases || 0);

  if (urgentCount === 0 && criticalClassrooms === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Urgent Attention Required</h3>
          <div className="text-sm text-red-800 space-y-1">
            {immediate_attention?.length > 0 && (
              <p>• {immediate_attention.length} students need immediate intervention</p>
            )}
            {overdue_cases > 0 && (
              <p>• {overdue_cases} cases overdue for follow-up</p>
            )}
            {criticalClassrooms > 0 && (
              <p>• {criticalClassrooms} classrooms in critical risk status</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
