import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { interventionMeetingApi } from '../../api/interventionApi';

export default function InterventionQuickAccess() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await interventionMeetingApi.getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load intervention stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const activeCount = stats ? stats.by_status.open + stats.by_status.monitoring : 0;
  const needsAttention = stats ? stats.high_urgency + stats.overdue_followups : 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Student Interventions
          </h3>
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="space-y-4">
          {/* Active Cases */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Cases</span>
            <span className="text-2xl font-bold text-blue-600">{activeCount}</span>
          </div>

          {/* Needs Attention */}
          {needsAttention > 0 && (
            <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-red-800">Needs Attention</span>
              <span className="text-xl font-bold text-red-600">{needsAttention}</span>
            </div>
          )}

          {/* Status Breakdown */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-green-50 p-2 rounded">
                <p className="text-green-800 font-medium">{stats.by_status.improving}</p>
                <p className="text-green-600 text-xs">Improving</p>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <p className="text-yellow-800 font-medium">{stats.by_status.not_improving}</p>
                <p className="text-yellow-600 text-xs">Not Improving</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => navigate('/form-master/interventions')}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Interventions →
          </button>
        </div>
      </div>
    </div>
  );
}
