import { useEffect } from 'react';

export default function RealtimeNotifications({ notifications, onDismiss }) {
  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    notifications.forEach(notification => {
      if (notification.type !== 'error') {
        setTimeout(() => {
          onDismiss(notification.id);
        }, 5000);
      }
    });
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 animate-slide-in ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">
                  {notification.type === 'success' ? '✅' :
                   notification.type === 'warning' ? '⚠️' :
                   notification.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span className="font-semibold text-sm">
                  {notification.type === 'success' ? 'Success' :
                   notification.type === 'warning' ? 'Alert' :
                   notification.type === 'error' ? 'Error' : 'Info'}
                </span>
              </div>
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs opacity-75 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'Connected': return 'bg-green-500';
      case 'Disconnected': return 'bg-red-500';
      case 'Error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
      <span>{status}</span>
    </div>
  );
}