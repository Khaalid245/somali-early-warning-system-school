class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  captureException(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      user: JSON.parse(localStorage.getItem('user') || '{}').username,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorEntry);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR TRACKER]', errorEntry);
    }

    // In production, send to backend
    this.sendToBackend(errorEntry);
  }

  async sendToBackend(errorEntry) {
    try {
      // Placeholder for backend error logging
      // await fetch('/api/errors/', {
      //   method: 'POST',
      //   body: JSON.stringify(errorEntry)
      // });
    } catch (err) {
      console.error('Failed to send error to backend:', err);
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();
