export default function AlertsList({ alerts, getRiskBadgeColor, getAlertStatusBadgeColor, onAlertAction, isLoading }) {
  if (!alerts || alerts.length === 0) {
    return <div className="p-12 text-center text-gray-500">No recent alerts</div>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {alerts.map((alert) => (
        <div key={alert.alert_id} className="p-6 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(alert.risk_level)}`}>
                  {alert.risk_level?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAlertStatusBadgeColor(alert.status)}`}>
                  {alert.status?.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">{alert.alert_type}</span>
              </div>
              <p className="font-semibold text-gray-800">{alert.student__full_name}</p>
              <p className="text-sm text-gray-600">{alert.subject__name}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(alert.alert_date).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              {alert.status === 'active' && (
                <button 
                  onClick={() => onAlertAction(alert.alert_id, 'under_review')}
                  disabled={isLoading(`alert-${alert.alert_id}`)}
                  className="px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                  aria-label={`Review alert for ${alert.student__full_name}`}
                >
                  {isLoading(`alert-${alert.alert_id}`) ? 'Processing...' : 'Review'}
                </button>
              )}
              {alert.status === 'under_review' && (
                <>
                  <button 
                    onClick={() => onAlertAction(alert.alert_id, 'escalated')}
                    disabled={isLoading(`alert-${alert.alert_id}`)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                    aria-label={`Escalate alert for ${alert.student__full_name}`}
                  >
                    {isLoading(`alert-${alert.alert_id}`) ? 'Processing...' : 'Escalate'}
                  </button>
                  <button 
                    onClick={() => onAlertAction(alert.alert_id, 'resolved')}
                    disabled={isLoading(`alert-${alert.alert_id}`)}
                    className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition text-sm font-medium disabled:opacity-50"
                    aria-label={`Resolve alert for ${alert.student__full_name}`}
                  >
                    {isLoading(`alert-${alert.alert_id}`) ? 'Processing...' : 'Resolve'}
                  </button>
                </>
              )}
              {alert.status === 'escalated' && (
                <span className="px-3 py-1.5 text-sm text-gray-500">Escalated to Admin</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
