import { Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const getRating = (onTime, avgDays, escalations) => {
  if (onTime >= 80 && avgDays <= 10 && escalations <= 2)
    return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  if (onTime >= 60 && avgDays <= 14 && escalations <= 5)
    return { label: 'Good',      color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200' };
  if (onTime >= 40)
    return { label: 'Fair',      color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return   { label: 'Needs support', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
};

export default function PerformanceMetrics({ data }) {
  const metrics = data || [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">Form master overview</p>
        <span className="text-xs text-gray-400">{metrics.length} tracked</span>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No performance data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Name</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Classroom</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Cases</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Avg. resolution</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">On-time</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Escalations</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metrics.map((fm) => {
                const rating = getRating(fm.on_time_percentage, fm.avg_resolution_days, fm.escalations);
                return (
                  <tr key={fm.form_master_id} className="hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-gray-900">{fm.form_master_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{fm.classrooms || '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block w-7 h-7 rounded-full text-xs font-semibold leading-7 ${
                        fm.active_cases > 10 ? 'bg-red-50 text-red-600' :
                        fm.active_cases > 5  ? 'bg-amber-50 text-amber-600' :
                                               'bg-green-50 text-green-600'
                      }`}>
                        {fm.active_cases}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs font-medium ${
                        fm.avg_resolution_days > 14 ? 'text-red-500' :
                        fm.avg_resolution_days > 10 ? 'text-amber-500' : 'text-green-600'
                      }`}>
                        {fm.avg_resolution_days}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-semibold ${
                          fm.on_time_percentage >= 80 ? 'text-green-600' :
                          fm.on_time_percentage >= 60 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {fm.on_time_percentage}%
                        </span>
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${
                              fm.on_time_percentage >= 80 ? 'bg-green-500' :
                              fm.on_time_percentage >= 60 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${fm.on_time_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs font-medium ${
                        fm.escalations > 5 ? 'text-red-500' :
                        fm.escalations > 2 ? 'text-amber-500' : 'text-gray-500'
                      }`}>
                        {fm.escalations}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${rating.color} ${rating.bg} ${rating.border}`}>
                        {rating.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
