import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export const OfflineBanner = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center z-50">
      <span className="font-semibold">⚠️ You're offline</span>
      <span className="ml-2">Some features may not work. Reconnecting...</span>
    </div>
  );
};

export const ServiceUnavailableBanner = ({ circuitBreakerState }) => {
  if (circuitBreakerState !== 'OPEN') return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white px-4 py-2 text-center z-50">
      <span className="font-semibold">⚠️ Service temporarily unavailable</span>
      <span className="ml-2">We're experiencing issues. Retrying automatically...</span>
    </div>
  );
};
