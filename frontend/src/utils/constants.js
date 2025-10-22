export const HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Python AI Backend Configuration
// export const AI_BACKEND_HOST = import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

// Monitoring Configuration
export const PROMETHEUS_URL = import.meta.env.VITE_PROMETHEUS_URL || "http://localhost:9090";
export const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || "http://localhost:3001";

// Node Backend Routes
export const AUTH_ROUTES = "api/auth";
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const REGISTER_ROUTE = `${AUTH_ROUTES}/register`;
export const USER_INFO_ROUTE = `${AUTH_ROUTES}/user-info`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;

// Log Routes
export const LOG_ROUTES = "api/logs";
export const GET_ALL_LOGS_ROUTE = `${LOG_ROUTES}/`;
export const GET_LOG_BY_ID_ROUTE = (logId) => `${LOG_ROUTES}/${logId}`;
export const CREATE_LOG_ROUTE = `${LOG_ROUTES}/`;
export const DELETE_LOG_ROUTE = (logId) => `${LOG_ROUTES}/${logId}`;

// Incident Routes
export const INCIDENT_ROUTES = "api/incidents";
export const GET_ALL_INCIDENTS_ROUTE = `${INCIDENT_ROUTES}/`;
export const GET_INCIDENT_BY_ID_ROUTE = (incidentId) => `${INCIDENT_ROUTES}/${incidentId}`;
export const CREATE_INCIDENT_ROUTE = `${INCIDENT_ROUTES}/`;
export const UPDATE_INCIDENT_ROUTE = (incidentId) => `${INCIDENT_ROUTES}/${incidentId}`;
export const DELETE_INCIDENT_ROUTE = (incidentId) => `${INCIDENT_ROUTES}/${incidentId}`;

// Service Routes
export const SERVICE_ROUTES = "api/services";
export const GET_ALL_SERVICES_ROUTE = `${SERVICE_ROUTES}/`;
export const GET_SERVICE_BY_ID_ROUTE = (serviceId) => `${SERVICE_ROUTES}/${serviceId}`;
export const CREATE_SERVICE_ROUTE = `${SERVICE_ROUTES}/`;
export const UPDATE_SERVICE_ROUTE = (serviceId) => `${SERVICE_ROUTES}/${serviceId}`;
export const DELETE_SERVICE_ROUTE = (serviceId) => `${SERVICE_ROUTES}/${serviceId}`;

// Deployment Routes
export const DEPLOYMENT_ROUTES = "api/deployments";
export const GET_ALL_DEPLOYMENTS_ROUTE = `${DEPLOYMENT_ROUTES}/`;
export const GET_DEPLOYMENT_BY_ID_ROUTE = (deploymentId) => `${DEPLOYMENT_ROUTES}/${deploymentId}`;
export const CREATE_DEPLOYMENT_ROUTE = `${DEPLOYMENT_ROUTES}/`;
export const UPDATE_DEPLOYMENT_ROUTE = (deploymentId) => `${DEPLOYMENT_ROUTES}/${deploymentId}`;
export const DELETE_DEPLOYMENT_ROUTE = (deploymentId) => `${DEPLOYMENT_ROUTES}/${deploymentId}`;

// Action Routes
export const ACTION_ROUTES = "api/actions";
export const GET_ALL_ACTIONS_ROUTE = `${ACTION_ROUTES}/`;
export const GET_ACTION_BY_ID_ROUTE = (actionId) => `${ACTION_ROUTES}/${actionId}`;
export const CREATE_ACTION_ROUTE = `${ACTION_ROUTES}/`;
export const EXECUTE_ACTION_ROUTE = (actionId) => `${ACTION_ROUTES}/${actionId}/execute`;

// Python AI Backend Configuration
export const AI_BACKEND_HOST = import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

// AI API Routes
export const AI_ANALYZE_ROUTE = "/api/ai/analyze";
export const AI_HEALTH_ROUTE = "/api/ai/health";

// Full endpoint URLs
export const AI_ANALYZE_URL = `${AI_BACKEND_HOST}${AI_ANALYZE_ROUTE}`;
export const AI_HEALTH_URL = `${AI_BACKEND_HOST}${AI_HEALTH_ROUTE}`;

// AI Routes Object (for easier import)
export const AI_ROUTES = {
  ANALYZE: AI_ANALYZE_URL,
  HEALTH: AI_HEALTH_URL,
};

// Request timeout (in milliseconds)
export const API_TIMEOUT = 60000; // 60 seconds for AI processing
