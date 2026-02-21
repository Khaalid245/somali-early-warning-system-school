import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SystemHealth({ data }) {
  const health = data?.system_health || {};
  const riskIndex = health.risk_index || 0;
  const status = health.status || 'moderate';

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-700',
          label: '🟢 Healthy',
          description: 'System operating within normal parameters'
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-700',
          label: '🟡 Moderate Risk',
          description: 'Elevated risk levels require monitoring'
        };
      case 'critical':
        return {
          icon: XCircle,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-700',
          label: '🔴 Critical',
          description: 'Immediate administrative action required'
        };
      default:
        return {
          icon: Activity,
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-700',
          label: 'Unknown',
          description: 'Status unavailable'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Calculate progress bar width (inverse - lower is better)
  const progressWidth = Math.min(100, riskIndex);
  const progressColor = riskIndex < 30 ? 'bg-green-500' : riskIndex < 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${config.textColor}`} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">School Risk Index</h2>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-900">{riskIndex.toFixed(1)}<span className="text-2xl text-gray-500">/100</span></div>
          <div className={`text-sm font-semibold ${config.textColor}`}>{config.label}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${progressColor} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Excellent)</span>
          <span>100 (Critical)</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">High Risk Students</div>
          <div className="text-2xl font-bold text-gray-900">{health.high_risk_count || 0}</div>
          <div className="text-xs text-gray-500">{health.high_risk_percentage?.toFixed(1)}% of total</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Avg Risk Score</div>
          <div className="text-2xl font-bold text-gray-900">{health.avg_risk_score?.toFixed(1) || 0}</div>
          <div className="text-xs text-gray-500">School average</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Students</div>
          <div className="text-2xl font-bold text-gray-900">{health.total_students || 0}</div>
          <div className="text-xs text-gray-500">Active enrollment</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">System Status</div>
          <div className={`text-lg font-bold ${config.textColor}`}>{config.label}</div>
          <div className="text-xs text-gray-500">Current state</div>
        </div>
      </div>
    </div>
  );
}
