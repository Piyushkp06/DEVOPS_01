import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'status'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

const incidentsTotal = new promClient.Counter({
  name: 'incidents_total',
  help: 'Total number of incidents created',
  labelNames: ['severity', 'status'],
  registers: [register],
});

const logsTotal = new promClient.Counter({
  name: 'logs_total',
  help: 'Total number of logs received',
  labelNames: ['level', 'service'],
  registers: [register],
});

const aiAnalysisRequests = new promClient.Counter({
  name: 'ai_analysis_requests_total',
  help: 'Total number of AI analysis requests',
  labelNames: ['source', 'status'],
  registers: [register],
});

const servicesHealth = new promClient.Gauge({
  name: 'services_health_status',
  help: 'Health status of monitored services (1 = healthy, 0 = unhealthy)',
  labelNames: ['service_name'],
  registers: [register],
});

// Export metrics
export {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseQueryDuration,
  incidentsTotal,
  logsTotal,
  aiAnalysisRequests,
  servicesHealth,
};
