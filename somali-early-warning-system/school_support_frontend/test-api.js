// Test API client configuration
import api from './src/api/apiClient.js';

console.log('Testing API client configuration...');
console.log('Base URL:', api.defaults.baseURL);

// Test a simple GET request
api.get('/health/')
  .then(response => {
    console.log('✅ API client working:', response.status);
  })
  .catch(error => {
    console.error('❌ API client error:', error.message);
    console.error('Request URL:', error.config?.url);
    console.error('Base URL:', error.config?.baseURL);
  });