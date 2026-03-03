// Enhanced error handling with retry logic
export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

export const errorHandler = {
  handle: (error, context = '') => {
    const userMessage = getUserFriendlyMessage(error);
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.status,
      context,
      timestamp: new Date().toISOString()
    };
    
    // Log error securely (no sensitive data)
    console.error(`[${context}] Error:`, errorDetails);
    
    return {
      userMessage,
      shouldRetry: isRetryableError(error),
      severity: getErrorSeverity(error)
    };
  }
};

const getUserFriendlyMessage = (error) => {
  if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (error.status === 403) return 'You do not have permission to perform this action.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status >= 500) return 'Server error. Please try again later.';
  if (error.message?.includes('network')) return 'Network connection issue. Please check your internet.';
  return 'An unexpected error occurred. Please try again.';
};

const isRetryableError = (error) => {
  return error.status >= 500 || error.message?.includes('network') || error.status === 429;
};

const getErrorSeverity = (error) => {
  if (error.status >= 500) return 'high';
  if (error.status === 403 || error.status === 401) return 'medium';
  return 'low';
};

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};