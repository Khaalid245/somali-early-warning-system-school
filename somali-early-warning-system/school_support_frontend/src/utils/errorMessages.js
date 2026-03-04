// Map technical errors to user-friendly messages
export const getUserFriendlyError = (error) => {
  // Network errors
  if (!error.response) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.error || error.response?.data?.message || error.message;

  // HTTP status code mapping
  const errorMap = {
    400: "Invalid request. Please check your input and try again.",
    401: "Your session has expired. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested information could not be found.",
    409: "This action conflicts with existing data. Please refresh and try again.",
    422: "The data provided is invalid. Please check and try again.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Server error. Our team has been notified. Please try again later.",
    502: "Service temporarily unavailable. Please try again in a few moments.",
    503: "Service is under maintenance. Please try again later.",
  };

  // Return mapped error or custom message
  if (errorMap[status]) {
    return errorMap[status];
  }

  // Check for specific error messages from backend
  if (message) {
    // Database errors
    if (message.includes('database') || message.includes('connection')) {
      return "Database connection issue. Please try again in a moment.";
    }
    
    // Validation errors
    if (message.includes('required') || message.includes('invalid')) {
      return `Validation error: ${message}`;
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('authorized')) {
      return "You don't have permission to perform this action.";
    }

    // Return the backend message if it's user-friendly (short and clear)
    if (message.length < 100 && !message.includes('Error:') && !message.includes('Exception')) {
      return message;
    }
  }

  // Default fallback
  return "Something went wrong. Please try again or contact support if the problem persists.";
};

// Specific error messages for common operations
export const operationErrors = {
  loadDashboard: "Unable to load dashboard data. Please refresh the page.",
  loadStudents: "Unable to load student information. Please try again.",
  loadAlerts: "Unable to load alerts. Please refresh the page.",
  loadCases: "Unable to load intervention cases. Please try again.",
  createCase: "Failed to create intervention case. Please check your input and try again.",
  updateCase: "Failed to update case. Please try again.",
  deleteCase: "Failed to delete case. Please try again.",
  updateAlert: "Failed to update alert status. Please try again.",
  exportData: "Failed to export data. Please try again.",
  uploadFile: "Failed to upload file. Please ensure the file is valid and try again.",
};
