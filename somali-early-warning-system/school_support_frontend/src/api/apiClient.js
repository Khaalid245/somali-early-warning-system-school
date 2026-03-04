import axios from "axios";
import { generateReplayProtectionHeaders } from '../utils/replayProtection';

const api = axios.create({
  baseURL: "http://139.59.153.67:8000/api",
  withCredentials: true,  // Send httpOnly cookies
  timeout: 30000,  // FIX 1: 30 second timeout
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

// Request interceptor
api.interceptors.request.use((config) => {
  // Add Authorization header from sessionStorage
  const token = sessionStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
          await axios.post(
            "http://139.59.153.67:8000/api/auth/refresh/",
            {},
            { withCredentials: true }
          );
          
          processQueue(null);
          isRefreshing = false;
          
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          sessionStorage.clear();
          localStorage.removeItem('token');
          window.location.href = "/login";
          return Promise.reject(refreshErr);
        }
      } else {
        // Direct 401/403 without token refresh
        sessionStorage.clear();
        localStorage.removeItem('token');
        window.location.href = "/login";
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
