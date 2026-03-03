// Secure session management with timeout warnings
export class SessionManager {
  constructor() {
    this.sessionTimeout = 60 * 60 * 1000; // 1 hour
    this.warningTime = 5 * 60 * 1000; // 5 minutes before timeout
    this.warningShown = false;
    this.timeoutId = null;
    this.warningId = null;
    this.setupSessionMonitoring();
  }

  setupSessionMonitoring() {
    this.resetTimeout();
    
    // Reset timeout on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, () => this.resetTimeout(), { passive: true });
    });
  }

  resetTimeout() {
    this.clearTimeouts();
    this.warningShown = false;
    
    // Set warning timer
    this.warningId = setTimeout(() => {
      this.showTimeoutWarning();
    }, this.sessionTimeout - this.warningTime);
    
    // Set logout timer
    this.timeoutId = setTimeout(() => {
      this.forceLogout();
    }, this.sessionTimeout);
  }

  showTimeoutWarning() {
    if (this.warningShown) return;
    this.warningShown = true;
    
    const modal = document.createElement("div");
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Session Timeout Warning</h3>
        <p class="text-gray-600 mb-6">Your session will expire in 5 minutes. Click "Stay Logged In" to continue.</p>
        <div class="flex gap-3">
          <button id="stay-logged-in" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Stay Logged In
          </button>
          <button id="logout-now" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
            Logout Now
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('stay-logged-in').onclick = () => {
      document.body.removeChild(modal);
      this.resetTimeout();
    };
    
    document.getElementById('logout-now').onclick = () => {
      document.body.removeChild(modal);
      this.forceLogout();
    };
  }

  forceLogout() {
    this.clearTimeouts();
    sessionStorage.clear();
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  clearTimeouts() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }

  destroy() {
    this.clearTimeouts();
  }
}

export const sessionManager = new SessionManager();