import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RiskIntelligence({ data }) {
  const trends = data?.monthly_trends || {};
  const riskDist = data?.risk_distribution || {};

  // Alert trend data
  const alertData = trends.alerts || [];
  
  // Case trend data
  const caseData = trends.cases || [];

  // Risk distribution for donut chart
  const riskDistData = [
    { name: 'Low', value: riskDist.low || 0, color: '#10b981' },
    { name: 'Medium', value: riskDist.medium || 0, color: '#f59e0b' },
    { name: 'High', value: riskDist.high || 0, color: '#ef4444' },
    { name: 'Critical', value: riskDist.critical || 0, color: '#7c3aed' }
  ];

  const totalRisk = riskDistData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Alert Trend */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Alert Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={alertData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} name="Active Alerts" />
            <Line type="monotone" dataKey="escalated" stroke="#ef4444" strokeWidth={2} name="Escalated" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Distribution Donut */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={riskDistData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {riskDistData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {riskDistData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {item.value} ({totalRisk > 0 ? ((item.value / totalRisk) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Case Trend */}
      <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Case Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={caseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="created" fill="#3b82f6" name="Cases Created" />
            <Bar dataKey="closed" fill="#10b981" name="Cases Closed" />
            <Bar dataKey="escalated" fill="#ef4444" name="Escalated" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
