import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Bell } from 'lucide-react';

export default function SystemHealth({ data }) {
  const health = data?.system_health || {};
  const totalStudents = data?.executive_kpis?.total_students || 0;
  const highRiskAlerts = data?.executive_kpis?.high_risk_alerts || 0;
  const activeAlerts = data?.executive_kpis?.active_alerts || 0;
  
  const riskIndex = totalStudents > 0 
    ? Math.min(100, ((highRiskAlerts * 2 + activeAlerts) / totalStudents) * 10)
    : 0;
  
  const status = riskIndex === 0 ? 'healthy' : riskIndex < 30 ? 'healthy' : riskIndex < 60 ? 'moderate' : 'critical';

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          emoji: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-700',
          barColor: 'bg-green-500',
          label: 'Everything is Good',
          description: 'School is doing well'
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          emoji: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-700',
          barColor: 'bg-yellow-500',
          label: 'Needs Attention',
          description: 'Some students need help'
        };
      case 'critical':
        return {
          icon: XCircle,
          emoji: '🚨',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-700',
          barColor: 'bg-red-500',
          label: 'Urgent Action Needed',
          description: 'Many students need help now'
        };
      default:
        return {
          icon: Activity,
          emoji: '❓',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-700',
          barColor: 'bg-gray-500',
          label: 'Unknown',
          description: 'Loading information...'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const progressWidth = Math.min(100, riskIndex);

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">School Status</h2>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <div className="text-center sm:text-right bg-white rounded-lg p-3 border-2 border-gray-200">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900">{riskIndex.toFixed(0)}</div>
            <div className={`text-xs sm:text-sm font-semibold ${config.textColor}`}>{config.label}</div>
          </div>
        </div>

        {/* Simple Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Risk Level</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">{riskIndex.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`${config.barColor} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${progressWidth}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>👍 Good (0)</span>
            <span>👎 Bad (100)</span>
          </div>
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl">👥</span>
          </div>
          <div className="text-3xl font-bold mb-1">{totalStudents}</div>
          <div className="text-sm opacity-90">Total Students</div>
          <div className="text-xs opacity-75 mt-1">All students in school</div>
        </div>

        {/* Students Needing Help */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-8 h-8 opacity-80" />
            <span className="text-3xl">🔔</span>
          </div>
          <div className="text-3xl font-bold mb-1">{activeAlerts}</div>
          <div className="text-sm opacity-90">Students Need Help</div>
          <div className="text-xs opacity-75 mt-1">Active alerts to check</div>
        </div>

        {/* High Risk Students */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="text-3xl font-bold mb-1">{highRiskAlerts}</div>
          <div className="text-sm opacity-90">High Risk Students</div>
          <div className="text-xs opacity-75 mt-1">Need urgent attention</div>
        </div>
      </div>

      {/* What This Means Section */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          What This Means
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          {riskIndex === 0 ? (
            <>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">✅</span>
                <span>All students are doing well - no alerts or concerns</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🎉</span>
                <span>Keep up the great work monitoring students</span>
              </p>
            </>
          ) : riskIndex < 30 ? (
            <>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">✅</span>
                <span>Most students are doing well</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">👀</span>
                <span>A few students need attention - check the alerts</span>
              </p>
            </>
          ) : riskIndex < 60 ? (
            <>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <span>Several students need help</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">📋</span>
                <span>Review alerts and assign teachers to help them</span>
              </p>
            </>
          ) : (
            <>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🚨</span>
                <span>Many students need urgent help</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">⚡</span>
                <span>Take action now - check escalated cases and alerts</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
