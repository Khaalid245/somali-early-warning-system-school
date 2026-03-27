import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities }) {
  const getConfig = (type) => {
    switch (type) {
      case 'case_created':   return { icon: FileText,      color: 'text-blue-500',  bg: 'bg-blue-50' };
      case 'case_escalated': return { icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-50' };
      case 'case_closed':    return { icon: CheckCircle,   color: 'text-green-600', bg: 'bg-green-50' };
      default:               return { icon: Clock,         color: 'text-gray-400',  bg: 'bg-gray-50' };
    }
  };

  const formatTime = (ts) => {
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); }
    catch { return 'Recently'; }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">Recent activity</p>
        <span className="text-xs text-gray-400">Last 7 days</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activities.map((activity, idx) => {
            const { icon: Icon, color, bg } = getConfig(activity.type);
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 transition"
              >
                <div className={`${bg} p-1.5 rounded-md flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activity.user} · {formatTime(activity.timestamp)}
                  </p>
                </div>
                {activity.case_id && (
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                    #{activity.case_id}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
