import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function RiskIntelligence({ data }) {
  const trends = data?.monthly_trends || {};
  const riskDist = data?.risk_distribution || {};

  // Use real backend data for weekly alerts (last 4 weeks from monthly_trends)
  const alertsData = trends.alerts || [];
  const weeklyAlertData = alertsData.slice(-4).map((item, idx) => ({
    week: `Week ${idx + 1}`,
    alerts: item.count || 0
  }));

  // Use real backend data for weekly cases (last 4 weeks from monthly_trends)
  const casesData = trends.cases || [];
  const weeklyCaseData = casesData.slice(-4).map((item, idx) => ({
    week: `Week ${idx + 1}`,
    opened: item.opened || 0,
    closed: item.closed || 0
  }));

  // Calculate trends
  const alertTrend = weeklyAlertData.length >= 2 && weeklyAlertData[weeklyAlertData.length - 1].alerts > weeklyAlertData[0].alerts ? 'up' : 'down';
  const caseTrend = weeklyCaseData.length >= 2 && weeklyCaseData[weeklyCaseData.length - 1].opened > weeklyCaseData[0].opened ? 'up' : 'down';

  // Risk distribution
  const riskData = [
    { name: 'Low Risk', value: riskDist.low || 0, color: '#10b981', emoji: '🟢' },
    { name: 'Medium Risk', value: riskDist.medium || 0, color: '#f59e0b', emoji: '🟡' },
    { name: 'High Risk', value: riskDist.high || 0, color: '#ef4444', emoji: '🔴' },
    { name: 'Critical', value: riskDist.critical || 0, color: '#7c3aed', emoji: '🚨' }
  ];

  const totalStudents = riskData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Weekly Alert Trend */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📈</span>
              Weekly Alerts
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">How many alerts each week</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            alertTrend === 'up' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {alertTrend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-semibold">{alertTrend === 'up' ? 'Going Up' : 'Going Down'}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyAlertData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value) => [`${value} alerts`, 'Total']}
            />
            <Line 
              type="monotone" 
              dataKey="alerts" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ fill: '#3b82f6', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            {alertTrend === 'up' ? '⚠️ More students need help this week' : '✅ Fewer students need help this week'}
          </p>
        </div>
      </div>

      {/* Risk Level Cards */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Student Risk Levels
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {riskData.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-lg shadow-md p-4 border-2 hover:shadow-lg transition"
              style={{ borderColor: item.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{item.value}</div>
              <div className="text-xs sm:text-sm font-medium text-gray-700">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(0) : 0}% of students
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Case Trend */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Weekly Cases
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">Cases opened vs closed each week</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            caseTrend === 'up' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {caseTrend === 'up' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-sm font-semibold">{caseTrend === 'up' ? 'More Cases' : 'Fewer Cases'}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyCaseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #10b981', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
            <Bar dataKey="opened" fill="#f59e0b" name="Cases Opened" radius={[8, 8, 0, 0]} />
            <Bar dataKey="closed" fill="#10b981" name="Cases Closed" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-xs text-orange-600 font-medium mb-1">This Week Opened</div>
            <div className="text-2xl font-bold text-orange-700">{weeklyCaseData[weeklyCaseData.length - 1]?.opened || 0}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xs text-green-600 font-medium mb-1">This Week Closed</div>
            <div className="text-2xl font-bold text-green-700">{weeklyCaseData[weeklyCaseData.length - 1]?.closed || 0}</div>
          </div>
        </div>
      </div>

      {/* Simple Explanation */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          What These Charts Mean
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">📈</span>
            <span><strong>Weekly Alerts:</strong> Shows how many students need help each week. If the line goes up, more students need attention.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🎯</span>
            <span><strong>Risk Levels:</strong> Shows how serious each student's problems are. Red and purple need urgent help.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">📋</span>
            <span><strong>Weekly Cases:</strong> Orange bars = new cases opened. Green bars = cases solved. More green is better!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
