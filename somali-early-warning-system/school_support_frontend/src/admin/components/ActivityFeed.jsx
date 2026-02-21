import { Activity, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'case_created':
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'case_escalated':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'case_closed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      default:
        return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">System Activity Feed</h2>
        </div>
        <div className="text-sm text-gray-600">Last 7 days</div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, idx) => {
            const config = getActivityIcon(activity.type);
            const Icon = config.icon;

            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <div className={`${config.bg} p-2 rounded-full`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>

                {activity.case_id && (
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 text-xs font-mono font-semibold text-blue-600 bg-blue-50 rounded border border-blue-200">
                      #{activity.case_id}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
