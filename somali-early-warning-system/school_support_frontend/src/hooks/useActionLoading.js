import { useState } from "react";

export const useActionLoading = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (key, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
  };

  const isLoading = (key) => loadingStates[key] || false;

  const isAnyLoading = () => Object.values(loadingStates).some(Boolean);

  return { setLoading, isLoading, isAnyLoading };
};
