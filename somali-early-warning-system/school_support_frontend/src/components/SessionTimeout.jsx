import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { logout } = useContext(AuthContext);
  
  const SESSION_TIMEOUT = 3600000; // 1 hour in milliseconds
  const WARNING_TIME = 300000; // 5 minutes before timeout
  
  useEffect(() => {
    let timeoutId;
    let warningId;
    let countdownId;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      clearInterval(countdownId);
      setShowWarning(false);
      
      // Show warning 5 minutes before timeout
      warningId = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(300); // 5 minutes in seconds
        
        // Countdown
        countdownId = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SESSION_TIMEOUT - WARNING_TIME);
      
      // Auto logout after timeout
      timeoutId = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);
    };
    
    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    resetTimer();
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      clearInterval(countdownId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);
  
  const handleStayLoggedIn = () => {
    setShowWarning(false);
    document.dispatchEvent(new Event('mousedown'));
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Session Expiring Soon</h3>
            <p className="text-sm text-slate-600">Your session will expire in</p>
          </div>
        </div>
        
        <div className="text-center my-6">
          <div className="text-4xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
          <p className="text-sm text-slate-600 mt-2">You will be automatically logged out</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Stay Logged In
          </button>
          <button
            onClick={logout}
            className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
