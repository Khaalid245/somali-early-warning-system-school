import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ExecutiveKPIs({ data }) {
  const kpis = data?.executive_kpis || {};

  const cards = [
    {
      title: 'Total Students',
      value: kpis.total_students || 0,
      subtitle: 'Active enrollment',
      trend: null,
      color: 'blue'
    },
    {
      title: 'Active Alerts',
      value: kpis.active_alerts || 0,
      subtitle: 'Requiring attention',
      trend: kpis.alert_trend,
      color: 'yellow',
      inverse: true
    },
    {
      title: 'High Risk Alerts',
      value: kpis.high_risk_alerts || 0,
      subtitle: 'Critical priority',
      trend: null,
      color: 'red'
    },
    {
      title: 'Open Cases',
      value: kpis.open_cases || 0,
      subtitle: 'In progress',
      trend: kpis.case_trend,
      color: 'orange',
      inverse: true
    },
    {
      title: 'Escalated Cases',
      value: kpis.escalated_cases || 0,
      subtitle: 'Admin action needed',
      trend: null,
      color: 'purple'
    },
    {
      title: 'Resolved This Month',
      value: kpis.resolved_this_month || 0,
      subtitle: 'Successfully closed',
      trend: null,
      color: 'green'
    }
  ];

  const getTrendIcon = (trend, inverse = false) => {
    if (!trend || trend === 0) return <Minus className="w-4 h-4" />;
    const isPositive = inverse ? trend < 0 : trend > 0;
    return isPositive ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = (trend, inverse = false) => {
    if (!trend || trend === 0) return 'text-gray-500';
    const isPositive = inverse ? trend < 0 : trend > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200',
      orange: 'bg-orange-50 border-orange-200',
      purple: 'bg-purple-50 border-purple-200',
      green: 'bg-green-50 border-green-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`${getColorClasses(card.color)} border-2 rounded-lg p-4 transition-all hover:shadow-md`}
        >
          <div className="text-sm font-medium text-gray-600 mb-1">{card.title}</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{card.value.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mb-2">{card.subtitle}</div>
          
          {card.trend !== null && card.trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor(card.trend, card.inverse)}`}>
              {getTrendIcon(card.trend, card.inverse)}
              <span>{Math.abs(card.trend)}% vs last month</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
