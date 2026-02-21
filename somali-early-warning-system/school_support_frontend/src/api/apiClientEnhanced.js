import axios from 'axios';
import { retryWithBackoff, apiCircuitBreaker } from '../utils/reliability';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Don't retry if already retried max times
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    // Retry on network errors or 5xx errors
    if (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK'
    ) {
      config.__retryCount++;
      const delay = Math.pow(2, config.__retryCount) * 1000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Wrap API calls with circuit breaker
const apiWithCircuitBreaker = {
  get: (url, config) => apiCircuitBreaker.execute(() => api.get(url, config)),
  post: (url, data, config) => apiCircuitBreaker.execute(() => api.post(url, data, config)),
  patch: (url, data, config) => apiCircuitBreaker.execute(() => api.patch(url, data, config)),
  delete: (url, config) => apiCircuitBreaker.execute(() => api.delete(url, config)),
};

export default apiWithCircuitBreaker;
