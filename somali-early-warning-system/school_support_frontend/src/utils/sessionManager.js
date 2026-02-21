const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 5 * 60 * 1000; // 5 minutes before timeout

export class SessionManager {
  constructor(onTimeout, onWarning) {
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.timeoutId = null;
    this.warningId = null;
    this.lastActivity = Date.now();
  }

  start() {
    this.resetTimer();
    this.attachListeners();
  }

  resetTimer() {
    this.clearTimers();
    this.lastActivity = Date.now();

    this.warningId = setTimeout(() => {
      this.onWarning?.();
    }, TIMEOUT_DURATION - WARNING_DURATION);

    this.timeoutId = setTimeout(() => {
      this.onTimeout?.();
    }, TIMEOUT_DURATION);
  }

  clearTimers() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }

  attachListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity);
    });
  }

  handleActivity = () => {
    const now = Date.now();
    if (now - this.lastActivity > 1000) { // Throttle to 1s
      this.resetTimer();
    }
  };

  destroy() {
    this.clearTimers();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }
}
