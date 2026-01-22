/**
 * TASK-071: Load tests with k6
 * Target: P95 latency < 100ms, 1000 events/second
 *
 * Run: k6 run tests/load/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const taskCreationTrend = new Trend('task_creation_duration');
const taskUpdateTrend = new Trend('task_update_duration');
const searchTrend = new Trend('search_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 500 },    // Ramp up to 500 users
    { duration: '2m', target: 1000 },   // Peak load: 1000 users
    { duration: '1m', target: 500 },    // Ramp down
    { duration: '30s', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],   // P95 latency < 100ms
    errors: ['rate<0.01'],              // Error rate < 1%
    task_creation_duration: ['p(95)<150'],
    task_update_duration: ['p(95)<100'],
    search_duration: ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

// Generate random task data
function generateTask() {
  const priorities = ['low', 'medium', 'high', 'critical'];
  return {
    title: `Load Test Task ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: 'This is a load test task',
    priority: priorities[Math.floor(Math.random() * priorities.length)],
  };
}

export default function () {
  const userId = `user-${__VU}`; // Virtual user ID

  // Scenario 1: Create a task
  const createStart = Date.now();
  const createResponse = http.post(
    `${BASE_URL}/api/${userId}/tasks`,
    JSON.stringify(generateTask()),
    { headers }
  );
  taskCreationTrend.add(Date.now() - createStart);

  const createSuccess = check(createResponse, {
    'create: status is 201': (r) => r.status === 201,
    'create: has task id': (r) => JSON.parse(r.body).id !== undefined,
  });
  errorRate.add(!createSuccess);

  if (!createSuccess) {
    console.error(`Create failed: ${createResponse.status} - ${createResponse.body}`);
    return;
  }

  const task = JSON.parse(createResponse.body);
  sleep(0.5);

  // Scenario 2: Update the task
  const updateStart = Date.now();
  const updateResponse = http.put(
    `${BASE_URL}/api/${userId}/tasks/${task.id}`,
    JSON.stringify({
      title: task.title + ' - Updated',
      priority: 'high',
    }),
    { headers }
  );
  taskUpdateTrend.add(Date.now() - updateStart);

  const updateSuccess = check(updateResponse, {
    'update: status is 200': (r) => r.status === 200,
  });
  errorRate.add(!updateSuccess);

  sleep(0.3);

  // Scenario 3: Search tasks
  const searchStart = Date.now();
  const searchResponse = http.get(
    `${BASE_URL}/api/todos/search?q=Load+Test&limit=10`,
    { headers }
  );
  searchTrend.add(Date.now() - searchStart);

  const searchSuccess = check(searchResponse, {
    'search: status is 200': (r) => r.status === 200,
    'search: returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(!searchSuccess);

  sleep(0.5);

  // Scenario 4: Set priority
  const priorityResponse = http.put(
    `${BASE_URL}/api/todos/${task.id}/priority?priority=critical`,
    null,
    { headers }
  );

  check(priorityResponse, {
    'priority: status is 200': (r) => r.status === 200,
  });

  sleep(0.3);

  // Scenario 5: Add tag
  const tagResponse = http.post(
    `${BASE_URL}/api/todos/${task.id}/tags`,
    JSON.stringify({ name: 'loadtest' }),
    { headers }
  );

  check(tagResponse, {
    'tag: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.3);

  // Scenario 6: Complete the task
  const completeResponse = http.patch(
    `${BASE_URL}/api/${userId}/tasks/${task.id}/complete`,
    null,
    { headers }
  );

  check(completeResponse, {
    'complete: status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Scenario 7: Delete the task (cleanup)
  const deleteResponse = http.del(
    `${BASE_URL}/api/${userId}/tasks/${task.id}`,
    null,
    { headers }
  );

  check(deleteResponse, {
    'delete: status is 204': (r) => r.status === 204,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;

  let summary = '\n========== LOAD TEST RESULTS ==========\n\n';

  summary += `Total Requests: ${metrics.http_reqs.values.count}\n`;
  summary += `Failed Requests: ${metrics.http_req_failed?.values.passes || 0}\n`;
  summary += `Error Rate: ${(metrics.errors?.values.rate * 100 || 0).toFixed(2)}%\n\n`;

  summary += 'Response Times (ms):\n';
  summary += `  P50: ${metrics.http_req_duration.values.med.toFixed(2)}\n`;
  summary += `  P90: ${metrics.http_req_duration.values['p(90)'].toFixed(2)}\n`;
  summary += `  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}\n`;
  summary += `  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}\n\n`;

  summary += 'Custom Metrics:\n';
  if (metrics.task_creation_duration) {
    summary += `  Task Creation P95: ${metrics.task_creation_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (metrics.task_update_duration) {
    summary += `  Task Update P95: ${metrics.task_update_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (metrics.search_duration) {
    summary += `  Search P95: ${metrics.search_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  summary += '\n========================================\n';

  return summary;
}
