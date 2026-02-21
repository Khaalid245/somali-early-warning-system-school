import { Users, Clock, TrendingUp, AlertCircle, Award } from 'lucide-react';

export default function PerformanceMetrics({ data }) {
  const metrics = data || [];

  const getPerformanceRating = (onTimePercentage, avgResolution, escalations) => {
    if (onTimePercentage >= 80 && avgResolution <= 10 && escalations <= 2) {
      return { label: 'Excellent', color: 'text-green-600', icon: '⭐⭐⭐' };
    } else if (onTimePercentage >= 60 && avgResolution <= 14 && escalations <= 5) {
      return { label: 'Good', color: 'text-blue-600', icon: '⭐⭐' };
    } else if (onTimePercentage >= 40) {
      return { label: 'Fair', color: 'text-yellow-600', icon: '⭐' };
    } else {
      return { label: 'Needs Improvement', color: 'text-red-600', icon: '⚠️' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Form Master Performance</h2>
        </div>
        <div className="text-sm text-gray-600">
          {metrics.length} form master{metrics.length !== 1 ? 's' : ''} tracked
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No performance data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Form Master</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Classrooms</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Active Cases</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Avg Resolution</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">On-Time %</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Escalations</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Avg Risk</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((fm) => {
                const rating = getPerformanceRating(fm.on_time_percentage, fm.avg_resolution_days, fm.escalations);
                
                return (
                  <tr key={fm.form_master_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{fm.form_master_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600" title={fm.classrooms}>
                        {fm.classrooms || 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                        fm.active_cases > 10 ? 'bg-red-100 text-red-700' :
                        fm.active_cases > 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {fm.active_cases}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`font-medium ${
                          fm.avg_resolution_days > 14 ? 'text-red-600' :
                          fm.avg_resolution_days > 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {fm.avg_resolution_days} days
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${
                          fm.on_time_percentage >= 80 ? 'text-green-600' :
                          fm.on_time_percentage >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {fm.on_time_percentage}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              fm.on_time_percentage >= 80 ? 'bg-green-500' :
                              fm.on_time_percentage >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${fm.on_time_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className={`w-4 h-4 ${
                          fm.escalations > 5 ? 'text-red-500' :
                          fm.escalations > 2 ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <span className="font-medium text-gray-900">{fm.escalations}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        fm.avg_risk_score >= 60 ? 'text-red-600' :
                        fm.avg_risk_score >= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {fm.avg_risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{rating.icon}</span>
                        <span className={`text-xs font-semibold ${rating.color}`}>
                          {rating.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Criteria</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
            <div>
              <div className="font-semibold text-gray-900">Excellent</div>
              <div className="text-gray-600">≥80% on-time, ≤10 days avg, ≤2 escalations</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
            <div>
              <div className="font-semibold text-gray-900">Good</div>
              <div className="text-gray-600">≥60% on-time, ≤14 days avg, ≤5 escalations</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1"></div>
            <div>
              <div className="font-semibold text-gray-900">Fair</div>
              <div className="text-gray-600">≥40% on-time, needs improvement</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1"></div>
            <div>
              <div className="font-semibold text-gray-900">Needs Improvement</div>
              <div className="text-gray-600">&lt;40% on-time, requires support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
