/**
 * TASK-071: Load tests with k6
 * Target: P95 latency < 100ms, 1000 concurrent users
 *
 * Run: k6 run tests/load/load-test.js
 * With env: k6 run -e BASE_URL=http://localhost:8001 -e AUTH_TOKEN=your-token tests/load/load-test.js
 *
 * Refs: REQ-014, COMP-009
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const taskCreationTrend = new Trend('task_creation_duration');
const taskUpdateTrend = new Trend('task_update_duration');
const taskListTrend = new Trend('task_list_duration');
const searchTrend = new Trend('search_duration');
const priorityTrend = new Trend('priority_update_duration');
const tagTrend = new Trend('tag_add_duration');
const deleteTrend = new Trend('task_delete_duration');
const kafkaEventsCounter = new Counter('kafka_events_expected');

// Test configuration
export const options = {
  scenarios: {
    // Smoke test: quick validation
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      tags: { scenario: 'smoke' },
      startTime: '0s',
    },
    // Load test: ramp to 1000 users
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // Ramp up to 100 users
        { duration: '1m', target: 500 },     // Ramp up to 500 users
        { duration: '2m', target: 1000 },    // Peak load: 1000 users
        { duration: '1m', target: 500 },     // Ramp down
        { duration: '30s', target: 0 },      // Ramp down to 0
      ],
      tags: { scenario: 'load' },
      startTime: '35s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100'],          // P95 latency < 100ms
    errors: ['rate<0.01'],                     // Error rate < 1%
    task_creation_duration: ['p(95)<150'],      // Task creation P95 < 150ms
    task_update_duration: ['p(95)<100'],        // Task update P95 < 100ms
    task_list_duration: ['p(95)<100'],          // Task list P95 < 100ms
    search_duration: ['p(95)<200'],            // Search P95 < 200ms
    priority_update_duration: ['p(95)<100'],    // Priority update P95 < 100ms
    tag_add_duration: ['p(95)<150'],           // Tag add P95 < 150ms
    task_delete_duration: ['p(95)<100'],        // Delete P95 < 100ms
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
  const tags = ['work', 'personal', 'urgent', 'home', 'shopping', 'health', 'finance'];
  return {
    title: `Load Test Task ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: `Automated load test task created by VU ${__VU} at iteration ${__ITER}`,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    tags: [tags[Math.floor(Math.random() * tags.length)]],
  };
}

export default function () {
  let taskId = null;

  // Scenario 1: Create a task
  group('Create Task', function () {
    const createStart = Date.now();
    const response = http.post(
      `${BASE_URL}/api/todos`,
      JSON.stringify(generateTask()),
      { headers }
    );
    taskCreationTrend.add(Date.now() - createStart);
    kafkaEventsCounter.add(1); // task.created event

    const success = check(response, {
      'create: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'create: has task id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    errorRate.add(!success);

    if (success) {
      try {
        taskId = JSON.parse(response.body).id;
      } catch (e) {
        // ignore parse errors
      }
    }
  });

  if (!taskId) {
    sleep(1);
    return;
  }

  sleep(0.3);

  // Scenario 2: List tasks
  group('List Tasks', function () {
    const start = Date.now();
    const response = http.get(
      `${BASE_URL}/api/todos?limit=20&offset=0`,
      { headers }
    );
    taskListTrend.add(Date.now() - start);

    const success = check(response, {
      'list: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Scenario 3: Update the task
  group('Update Task', function () {
    const start = Date.now();
    const response = http.put(
      `${BASE_URL}/api/todos/${taskId}`,
      JSON.stringify({
        title: `Updated Task ${Date.now()}`,
        priority: 'high',
      }),
      { headers }
    );
    taskUpdateTrend.add(Date.now() - start);
    kafkaEventsCounter.add(1); // task.updated event

    const success = check(response, {
      'update: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Scenario 4: Search tasks
  group('Search Tasks', function () {
    const searchTerms = ['Load Test', 'Updated', 'Task', 'work', 'urgent'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const start = Date.now();
    const response = http.get(
      `${BASE_URL}/api/todos/search?q=${encodeURIComponent(term)}&limit=10`,
      { headers }
    );
    searchTrend.add(Date.now() - start);

    const success = check(response, {
      'search: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Scenario 5: Set priority
  group('Set Priority', function () {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const start = Date.now();
    const response = http.put(
      `${BASE_URL}/api/todos/${taskId}/priority?priority=${priority}`,
      null,
      { headers }
    );
    priorityTrend.add(Date.now() - start);
    kafkaEventsCounter.add(1); // task.priority_changed event

    const success = check(response, {
      'priority: status is 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Scenario 6: Add tag
  group('Add Tag', function () {
    const tags = ['loadtest', 'perf', 'automated', 'k6'];
    const tag = tags[Math.floor(Math.random() * tags.length)];

    const start = Date.now();
    const response = http.post(
      `${BASE_URL}/api/todos/${taskId}/tags`,
      JSON.stringify({ name: tag }),
      { headers }
    );
    tagTrend.add(Date.now() - start);
    kafkaEventsCounter.add(1); // task.tagged event

    const success = check(response, {
      'tag: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
    errorRate.add(!success);
  });

  sleep(0.3);

  // Scenario 7: Delete the task (cleanup)
  group('Delete Task', function () {
    const start = Date.now();
    const response = http.del(
      `${BASE_URL}/api/todos/${taskId}`,
      null,
      { headers }
    );
    deleteTrend.add(Date.now() - start);
    kafkaEventsCounter.add(1); // task.deleted event

    const success = check(response, {
      'delete: status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    });
    errorRate.add(!success);
  });

  sleep(0.5);
}

// Summary report
export function handleSummary(data) {
  const report = generateReport(data);

  return {
    stdout: report,
    'tests/load/load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function generateReport(data) {
  const { metrics } = data;

  let report = '\n';
  report += '╔══════════════════════════════════════════════════════════════╗\n';
  report += '║             TODOAPP LOAD TEST RESULTS                      ║\n';
  report += '╠══════════════════════════════════════════════════════════════╣\n';

  // General stats
  const totalReqs = metrics.http_reqs?.values?.count || 0;
  const errRate = ((metrics.errors?.values?.rate || 0) * 100).toFixed(2);
  report += `║  Total Requests:     ${String(totalReqs).padStart(8)}                       ║\n`;
  report += `║  Error Rate:         ${String(errRate + '%').padStart(8)}                       ║\n`;

  // Response times
  report += '╠══════════════════════════════════════════════════════════════╣\n';
  report += '║  HTTP Response Times (ms)                                  ║\n';
  report += '╠══════════════════════════════════════════════════════════════╣\n';

  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    report += `║  P50:  ${String(d.med?.toFixed(2) || 'N/A').padStart(10)}                                   ║\n`;
    report += `║  P90:  ${String(d['p(90)']?.toFixed(2) || 'N/A').padStart(10)}                                   ║\n`;
    report += `║  P95:  ${String(d['p(95)']?.toFixed(2) || 'N/A').padStart(10)}    Target: < 100ms               ║\n`;
    report += `║  P99:  ${String(d['p(99)']?.toFixed(2) || 'N/A').padStart(10)}                                   ║\n`;
  }

  // Custom metrics
  report += '╠══════════════════════════════════════════════════════════════╣\n';
  report += '║  Custom Metrics (P95, ms)                                  ║\n';
  report += '╠══════════════════════════════════════════════════════════════╣\n';

  const customMetrics = [
    ['Task Creation', 'task_creation_duration', '< 150ms'],
    ['Task Update', 'task_update_duration', '< 100ms'],
    ['Task List', 'task_list_duration', '< 100ms'],
    ['Search', 'search_duration', '< 200ms'],
    ['Priority Set', 'priority_update_duration', '< 100ms'],
    ['Tag Add', 'tag_add_duration', '< 150ms'],
    ['Task Delete', 'task_delete_duration', '< 100ms'],
  ];

  for (const [label, key, target] of customMetrics) {
    if (metrics[key]) {
      const val = metrics[key].values['p(95)']?.toFixed(2) || 'N/A';
      report += `║  ${label.padEnd(16)} ${String(val).padStart(8)}    Target: ${target.padEnd(10)}    ║\n`;
    }
  }

  // Kafka events
  if (metrics.kafka_events_expected) {
    const evts = metrics.kafka_events_expected.values.count || 0;
    report += '╠══════════════════════════════════════════════════════════════╣\n';
    report += `║  Expected Kafka Events: ${String(evts).padStart(8)}                       ║\n`;
  }

  // Thresholds
  report += '╠══════════════════════════════════════════════════════════════╣\n';
  report += '║  Threshold Results                                         ║\n';
  report += '╠══════════════════════════════════════════════════════════════╣\n';

  if (data.root_group?.checks) {
    const checks = data.root_group.checks;
    for (const c of checks) {
      const status = c.fails === 0 ? 'PASS' : 'FAIL';
      report += `║  [${status}] ${c.name.substring(0, 50).padEnd(50)}   ║\n`;
    }
  }

  report += '╚══════════════════════════════════════════════════════════════╝\n';

  return report;
}
