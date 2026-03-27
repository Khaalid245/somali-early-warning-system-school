import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

// Fixed colors per status — consistent regardless of order
const STATUS_COLORS = {
  'Open':               '#3b82f6',  // blue
  'In Progress':        '#f59e0b',  // amber
  'Awaiting Parent':    '#8b5cf6',  // purple
  'Escalated To Admin': '#ef4444',  // red
  'Closed':             '#10b981',  // green
};

export default function ChartsVisualization({ dashboardData }) {
  // Valid InterventionCase statuses only — filter out stale/unknown statuses and zero counts
  const VALID_CASE_STATUSES = ['open', 'in_progress', 'awaiting_parent', 'escalated_to_admin', 'closed'];
  const caseStatusData = (dashboardData.case_status_breakdown || [])
    .filter(item => item.count > 0 && VALID_CASE_STATUSES.includes(item.status))
    .map(item => ({
      status: item.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: item.count
    }));

  // Absence trend — reads absence_trend from dashboard API
  const absenceTrendData = dashboardData.absence_trend || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Case Status Distribution Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Case Status Distribution</h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Absence Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Absence Trend Analysis</h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={absenceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="absences" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
