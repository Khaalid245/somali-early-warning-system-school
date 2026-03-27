import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, FileText, Shield } from 'lucide-react';

export default function RiskIntelligence({ data }) {
  const riskDist = data?.risk_distribution || {};

  const alertsData = (data?.monthly_alert_trend || []).slice(-8).map((item) => ({
    week: item.month ? item.month.slice(5) : '',
    alerts: item.count || 0
  }));

  const casesData = (data?.monthly_case_trend || []).slice(-8).map((item) => ({
    week: item.month ? item.month.slice(5) : '',
    cases: item.count || 0
  }));

  const alertTrend = alertsData.length >= 2 &&
    alertsData[alertsData.length - 1].alerts > alertsData[0].alerts ? 'up' : 'down';
  const caseTrend = casesData.length >= 2 &&
    casesData[casesData.length - 1].cases > casesData[0].cases ? 'up' : 'down';

  const riskData = [
    { name: 'Low',      value: riskDist.low      || 0, color: '#16A34A', icon: Shield },
    { name: 'Medium',   value: riskDist.medium   || 0, color: '#F59E0B', icon: AlertCircle },
    { name: 'High',     value: riskDist.high     || 0, color: '#EA580C', icon: AlertCircle },
    { name: 'Critical', value: riskDist.critical || 0, color: '#DC2626', icon: AlertCircle },
  ];

  const totalStudents = riskData.reduce((sum, item) => sum + item.value, 0);

  const chartStyle = {
    contentStyle: {
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }
  };

  return (
    <div className="space-y-4">

      {/* Risk level cards */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Student risk levels</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {riskData.map((item, idx) => {
            const Icon = item.icon;
            const pct = totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(0) : 0;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">{item.value}</div>
                <div className="text-xs text-gray-500">{item.name} risk</div>
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Alert trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Students needing attention this week</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {alertTrend === 'up' ? 'More students need help compared to earlier' : 'Fewer students need help — trend improving'}
              </p>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              alertTrend === 'up' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {alertTrend === 'up'
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {alertTrend === 'up' ? 'Rising' : 'Improving'}
            </span>
          </div>

          {alertsData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertsData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartStyle} formatter={(v) => [`${v} alerts`, '']} />
                <Bar dataKey="alerts" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <a href="#" className="text-xs text-blue-600 hover:underline mt-2 inline-block">View students →</a>
        </div>

        {/* Case trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Open cases over time</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {caseTrend === 'up' ? 'More cases opened recently' : 'Cases are being resolved — good progress'}
              </p>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              caseTrend === 'up' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
            }`}>
              {caseTrend === 'up'
                ? <TrendingUp className="w-3 h-3" />
                : <CheckCircle className="w-3 h-3" />}
              {caseTrend === 'up' ? 'More cases' : 'Resolving'}
            </span>
          </div>

          {casesData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={casesData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartStyle} formatter={(v) => [`${v} cases`, '']} />
                <Bar dataKey="cases" fill="#FCD34D" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <a href="#" className="text-xs text-blue-600 hover:underline mt-2 inline-block">View cases →</a>
        </div>

      </div>
    </div>
  );
}
