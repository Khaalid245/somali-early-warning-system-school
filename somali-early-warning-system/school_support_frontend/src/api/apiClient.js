import axios from "axios";
import { generateReplayProtectionHeaders } from '../utils/replayProtection';

// API Configuration - Support both HTTP (dev) and HTTPS (production)
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const CLEAN_API_URL = API_URL;
console.log('[apiClient] Using API URL:', CLEAN_API_URL);

const api = axios.create({
  baseURL: CLEAN_API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Make showToast available globally for API client
if (typeof window !== 'undefined') {
  import('../utils/toast').then(({ showToast }) => {
    window.showToast = showToast;
  });
}

// Request interceptor
api.interceptors.request.use((config) => {
  // Force HTTP for local development (prevent SSL errors)
  if (config.url && (config.url.includes('127.0.0.1') || config.url.includes('localhost'))) {
    config.url = config.url.replace(/^https:\/\//, 'http://');
  }
  if (config.baseURL && (config.baseURL.includes('127.0.0.1') || config.baseURL.includes('localhost'))) {
    config.baseURL = config.baseURL.replace(/^https:\/\//, 'http://');
  }
  
  // Ensure proper JSON serialization
  if (config.data && typeof config.data === 'object') {
    config.data = JSON.stringify(config.data);
  }
  
  // Add Authorization header from sessionStorage
  const token = sessionStorage.getItem("access");
  if (token) {
    // Validate token before using it
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp * 1000 > Date.now()) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('Token expired, removing from storage');
        sessionStorage.removeItem('access');
      }
    } catch (err) {
      console.error('Invalid token format, removing from storage:', err);
      sessionStorage.removeItem('access');
    }
  }
  
  // Add replay protection headers for state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    const replayHeaders = generateReplayProtectionHeaders();
    config.headers = { ...config.headers, ...replayHeaders };
  }

  config.headers["Content-Type"] = "application/json";
  config.headers["Accept"] = "application/json";

  return config;
});

// Response interceptor (auto-refresh token + 401/403 handling + retry logic)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // FIX 2: Handle 401/403 - Redirect to login
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (error.response?.data?.code === "token_not_valid" && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return api(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
          const refreshResponse = await axios.post(
            `${baseURL}/auth/refresh/`,
            {},
            { withCredentials: true }
          );
          
          // Update access token if provided in response
          if (refreshResponse.data?.access) {
            sessionStorage.setItem('access', refreshResponse.data.access);
          }
          
          processQueue(null);
          isRefreshing = false;
          
          return api(originalRequest);
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          processQueue(refreshErr, null);
          isRefreshing = false;
          sessionStorage.clear();
          localStorage.removeItem('token');
          
          // Show user-friendly message
          if (window.showToast) {
            window.showToast.error('Session expired. Please log in again.');
          }
          
          // Delay redirect to allow toast to show
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          
          return Promise.reject(refreshErr);
        }
      } else {
        // Direct 401/403 without token refresh - DON'T auto-redirect
        console.error('Authentication failed:', error.response?.data);
        
        // Let the calling component handle the error instead of auto-redirecting
        return Promise.reject(error);
      }
    }

    // FIX 4: Retry logic with exponential backoff (network errors only)
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (!error.response && originalRequest._retryCount < 3) {
      originalRequest._retryCount++;
      const delay = Math.pow(2, originalRequest._retryCount) * 1000; // 2s, 4s, 8s
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
