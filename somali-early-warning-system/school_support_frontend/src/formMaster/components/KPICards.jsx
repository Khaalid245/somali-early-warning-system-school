import { Target, Bell, FileText, AlertOctagon } from 'lucide-react';

export default function KPICards({ data, getTrendIcon, getTrendColor }) {
  const trendPercent = data?.statistics?.trends?.new_cases_trend || 0;
  const trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'stable';
  
  const criticalMetrics = [
    {
      label: 'Students Needing Support',
      value: data?.high_risk_students?.length || 0,
      icon: Target,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Attendance <75% or missed >3 days (last 30 days)'
    },
    {
      label: 'Active Alerts',
      value: data?.urgent_alerts?.length || 0,
      icon: Bell,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: trendDirection,
      change: Math.abs(trendPercent),
      description: 'Unresolved alerts raised by teachers'
    },
    {
      label: 'Open Cases',
      value: data?.pending_cases?.filter(c => c.status !== 'closed').length || data?.statistics?.open_cases || 0,
      icon: FileText,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: trendDirection,
      change: Math.abs(trendPercent),
      description: 'Intervention cases not yet closed'
    },
    {
      label: 'Escalated to Admin',
      value: data?.pending_cases?.filter(c => c.status === 'escalated_to_admin').length || 0,
      icon: AlertOctagon,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Cases requiring admin or family contact'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {criticalMetrics.map((metric, idx) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200 p-6 transition-all hover:shadow-md"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
              {metric.trend && metric.change !== undefined && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTrendColor(metric.trend, true)}`}>
                  {getTrendIcon(metric.trend)} {Math.abs(metric.change)}%
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm font-medium mb-2">{metric.label}</p>
            <p className="text-4xl font-semibold text-gray-900 mb-1">{metric.value}</p>
            {metric.description && (
              <p className="text-xs text-gray-400 mt-2 leading-snug">{metric.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
