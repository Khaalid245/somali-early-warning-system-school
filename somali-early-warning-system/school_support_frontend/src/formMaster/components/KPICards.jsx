import { tokens, supportiveLanguage } from '../utils/designTokens';

export default function KPICards({ data, getTrendIcon, getTrendColor }) {
  const trendPercent = data?.statistics?.trends?.new_cases_trend || 0;
  const trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'stable';
  
  const criticalMetrics = [
    {
      label: 'Students Needing Support',
      value: data?.high_risk_students?.length || 0,
      icon: '🎯',
      priority: 'critical',
      description: 'Require immediate attention'
    },
    {
      label: 'Active Alerts',
      value: data?.urgent_alerts?.length || 0,
      icon: '🔔',
      priority: 'attention',
      trend: trendDirection,
      change: Math.abs(trendPercent)
    },
    {
      label: 'Open Cases',
      value: data?.statistics?.open_cases || 0,
      icon: '📋',
      priority: 'warning',
      trend: trendDirection,
      change: Math.abs(trendPercent)
    },
    {
      label: 'Escalated',
      value: data?.pending_cases?.filter(c => c.status === 'escalated_to_admin').length || 0,
      icon: '🚨',
      priority: 'attention'
    }
  ];

  const getPriorityStyle = (priority) => {
    const styles = {
      critical: 'border-l-4 border-red-500 bg-red-50',
      attention: 'border-l-4 border-orange-500 bg-orange-50',
      warning: 'border-l-4 border-yellow-500 bg-yellow-50'
    };
    return styles[priority] || 'bg-white';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {criticalMetrics.map((metric, idx) => (
        <div
          key={idx}
          className={`${getPriorityStyle(metric.priority)} rounded-xl shadow-md border border-slate-200 p-6 transition-all hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <span className="text-3xl">{metric.icon}</span>
            </div>
            {metric.trend && metric.change !== undefined && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTrendColor(metric.trend, true)} bg-white`}>
                {getTrendIcon(metric.trend)} {Math.abs(metric.change)}%
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm font-medium mb-2">{metric.label}</p>
          <p className="text-5xl font-bold text-slate-900 mb-1">{metric.value}</p>
          {metric.description && (
            <p className="text-xs text-slate-500 mt-2">{metric.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
