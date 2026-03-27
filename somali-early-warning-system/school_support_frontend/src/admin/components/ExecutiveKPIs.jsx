import { TrendingUp, TrendingDown, Minus, Users, Bell, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function ExecutiveKPIs({ data }) {
  const kpis = data?.executive_kpis || {};

  const cards = [
    {
      title: 'Total Students',
      value: kpis.total_students || 0,
      subtitle: 'Active enrolment',
      trend: null,
      color: 'neutral',
      icon: Users
    },
    {
      title: 'Active Alerts',
      value: kpis.active_alerts || 0,
      subtitle: 'Requiring attention',
      trend: kpis.alert_trend,
      inverse: true,
      color: 'yellow',
      icon: Bell
    },
    {
      title: 'Students at High Risk',
      value: kpis.high_risk_alerts || 0,
      subtitle: 'High or critical level',
      trend: null,
      color: 'red',
      icon: AlertCircle
    },
    {
      title: 'Open Cases',
      value: kpis.open_cases || 0,
      subtitle: 'In progress',
      trend: kpis.case_trend,
      inverse: true,
      color: 'orange',
      icon: FileText
    },
    {
      title: 'Escalated to Admin',
      value: kpis.escalated_cases || 0,
      subtitle: 'Needs your action',
      trend: null,
      color: 'red',
      icon: AlertCircle
    },
    {
      title: 'Resolved This Month',
      value: kpis.resolved_this_month || 0,
      subtitle: 'Successfully closed',
      trend: null,
      color: 'green',
      icon: CheckCircle
    }
  ];

  const getTrendIcon = (trend, inverse = false) => {
    if (!trend || trend === 0) return <Minus className="w-3 h-3" />;
    const isGood = inverse ? trend < 0 : trend > 0;
    return isGood ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />;
  };

  const getTrendColor = (trend, inverse = false) => {
    if (!trend || trend === 0) return 'text-gray-400';
    const isGood = inverse ? trend < 0 : trend > 0;
    return isGood ? 'text-green-600' : 'text-red-500';
  };

  const colorMap = {
    neutral: { border: 'border-gray-200', icon: 'text-gray-500', value: 'text-gray-900' },
    yellow:  { border: 'border-amber-200', icon: 'text-amber-500', value: 'text-gray-900' },
    red:     { border: 'border-red-200',   icon: 'text-red-500',   value: 'text-gray-900' },
    orange:  { border: 'border-orange-200',icon: 'text-orange-500',value: 'text-gray-900' },
    green:   { border: 'border-green-200', icon: 'text-green-600', value: 'text-gray-900' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const c = colorMap[card.color] || colorMap.neutral;
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white border ${c.border} rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium leading-tight">{card.title}</span>
              <Icon className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
            </div>
            <div className={`text-2xl font-semibold ${c.value} mb-1`}>{card.value.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{card.subtitle}</div>
            {card.trend !== null && card.trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor(card.trend, card.inverse)}`}>
                {getTrendIcon(card.trend, card.inverse)}
                <span>{Math.abs(card.trend)}% vs last month</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
