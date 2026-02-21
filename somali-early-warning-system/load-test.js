import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://127.0.0.1:8000/api';

export function setup() {
  // Login to get token
  const loginRes = http.post(`${BASE_URL}/auth/login/`, JSON.stringify({
    username: 'testuser',
    password: 'testpass123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('access') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test dashboard load
  const dashboardRes = http.get(`${BASE_URL}/dashboard/`, { headers });
  check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test alerts list
  const alertsRes = http.get(`${BASE_URL}/alerts/`, { headers });
  check(alertsRes, {
    'alerts status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test cases list
  const casesRes = http.get(`${BASE_URL}/interventions/cases/`, { headers });
  check(casesRes, {
    'cases status is 200': (r) => r.status === 200,
  });

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}
