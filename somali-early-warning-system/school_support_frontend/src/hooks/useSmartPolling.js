import { useEffect, useRef, useCallback } from 'react';

export const useSmartPolling = (callback, interval = 30000) => {
  const savedCallback = useRef();
  const intervalRef = useRef();
  const isVisible = useRef(true);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (isVisible.current && document.visibilityState === 'visible') {
        savedCallback.current?.();
      }
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
      if (isVisible.current) {
        savedCallback.current?.(); // Refetch on tab focus
      }
    };

    const handleFocus = () => {
      savedCallback.current?.(); // Refetch on window focus
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [startPolling, stopPolling]);

  return { stopPolling, startPolling };
};
