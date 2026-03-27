import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/apiClient';

const AuthDebugger = () => {
  const [authStatus, setAuthStatus] = useState({});
  const [testResult, setTestResult] = useState(null);

  const checkAuthStatus = () => {
    const token = sessionStorage.getItem('access');
    const refresh = sessionStorage.getItem('refresh');
    
    let status = {
      hasToken: !!token,
      hasRefresh: !!refresh,
      tokenValid: false,
      tokenExpiry: null,
      userInfo: null,
      error: null
    };

    if (token) {
      try {
        const decoded = jwtDecode(token);
        status.tokenValid = decoded.exp * 1000 > Date.now();
        status.tokenExpiry = new Date(decoded.exp * 1000).toLocaleString();
        status.userInfo = {
          userId: decoded.user_id,
          email: decoded.email,
          role: decoded.role
        };
      } catch (err) {
        status.error = err.message;
      }
    }

    setAuthStatus(status);
  };

  const testAttendanceAPI = async () => {
    setTestResult({ loading: true });
    
    try {
      const response = await api.post('/attendance/sessions/', {
        classroom: 1,
        subject: 1,
        period: '1',
        attendance_date: new Date().toISOString().split('T')[0],
        records: [
          { student: 1, status: 'present', remarks: '' }
        ]
      });
      
      setTestResult({ 
        success: true, 
        status: response.status,
        message: 'API call successful'
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: err.response?.status,
        message: err.response?.data?.error || err.message,
        fullError: err.response?.data
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      
      <div className="text-xs space-y-1">
        <div className={`flex items-center gap-2 ${authStatus.hasToken ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${authStatus.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
          Token: {authStatus.hasToken ? 'Present' : 'Missing'}
        </div>
        
        <div className={`flex items-center gap-2 ${authStatus.tokenValid ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${authStatus.tokenValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
          Valid: {authStatus.tokenValid ? 'Yes' : 'No'}
        </div>
        
        {authStatus.tokenExpiry && (
          <div className="text-gray-600">
            Expires: {authStatus.tokenExpiry}
          </div>
        )}
        
        {authStatus.userInfo && (
          <div className="text-gray-600">
            User: {authStatus.userInfo.email} ({authStatus.userInfo.role})
          </div>
        )}
        
        {authStatus.error && (
          <div className="text-red-600">
            Error: {authStatus.error}
          </div>
        )}
      </div>
      
      <div className="mt-3 space-y-2">
        <button
          onClick={checkAuthStatus}
          className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Refresh Status
        </button>
        
        <button
          onClick={testAttendanceAPI}
          disabled={testResult?.loading}
          className="w-full px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
        >
          {testResult?.loading ? 'Testing...' : 'Test Attendance API'}
        </button>
      </div>
      
      {testResult && !testResult.loading && (
        <div className={`mt-2 p-2 rounded text-xs ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div>Status: {testResult.status}</div>
          <div>Message: {testResult.message}</div>
          {testResult.fullError && (
            <details className="mt-1">
              <summary className="cursor-pointer">Full Error</summary>
              <pre className="text-xs mt-1 overflow-auto max-h-20">
                {JSON.stringify(testResult.fullError, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;