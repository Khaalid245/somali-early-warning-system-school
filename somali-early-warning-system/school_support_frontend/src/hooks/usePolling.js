import { useEffect, useRef } from 'react';

export const usePolling = (callback, interval = 30000, enabled = true) => {
  const savedCallback = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current?.();
    };

    intervalRef.current = setInterval(tick, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return { stopPolling };
};
