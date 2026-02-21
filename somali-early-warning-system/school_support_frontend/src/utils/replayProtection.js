// Replay Attack Prevention - Request Nonce Generator
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate headers to prevent replay attacks
 * @returns {Object} Headers with nonce and timestamp
 */
export const generateReplayProtectionHeaders = () => {
  return {
    'X-Request-Nonce': uuidv4(),
    'X-Request-Timestamp': Date.now().toString()
  };
};

/**
 * Enhanced API client with replay attack protection
 */
export const secureApiCall = async (method, url, data = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...generateReplayProtectionHeaders()
  };
  
  const config = {
    method,
    headers,
    credentials: 'include', // Send httpOnly cookies
  };
  
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};
