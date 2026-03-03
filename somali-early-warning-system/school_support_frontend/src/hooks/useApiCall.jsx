import { useState } from 'react';

// Custom hook for API calls with loading and error states
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (apiCall, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      showSuccessMessage = false,
      retries = 0,
      retryDelay = 1000 
    } = options;

    setLoading(true);
    setError(null);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const result = await apiCall();
        
        if (showSuccessMessage) {
          console.log('Operation completed successfully');
        }
        
        if (onSuccess) onSuccess(result);
        setLoading(false);
        return result;
      } catch (err) {
        attempt++;
        
        if (attempt > retries) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          
          if (onError) onError(err);
          setLoading(false);
          throw err;
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return { loading, error, execute, reset };
}

export function getErrorMessage(error) {
  if (error.response?.data?.error) {
    if (Array.isArray(error.response.data.error)) {
      return error.response.data.error[0];
    }
    return error.response.data.error;
  }
  
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error.response?.data?.non_field_errors) {
    return error.response.data.non_field_errors[0];
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-4 border-blue-600 ${sizeClasses[size]} mb-2`}></div>
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}

export function ErrorDisplay({ error, onRetry, onDismiss }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
        <div className="ml-4 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}