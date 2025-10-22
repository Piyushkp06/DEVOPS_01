import axios, { AxiosInstance } from 'axios';

// API Configuration
export const API_CONFIG = {
  NODE_BACKEND: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  PYTHON_BACKEND: import.meta.env.VITE_AI_API_URL || 'http://localhost:8000',
  PROMETHEUS: import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090',
  GRAFANA: import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
};

// Create axios instances
export const nodeBackendAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.NODE_BACKEND,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const pythonBackendAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.PYTHON_BACKEND,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const prometheusAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.PROMETHEUS,
  timeout: API_CONFIG.TIMEOUT,
});

export const grafanaAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.GRAFANA,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor for error handling
const errorInterceptor = (error: any) => {
  if (error.response) {
    console.error('API Error:', {
      status: error.response.status,
      data: error.response.data,
      url: error.config?.url,
    });
  } else if (error.request) {
    console.error('Network Error:', error.message);
  }
  return Promise.reject(error);
};

// Apply interceptors
[nodeBackendAPI, pythonBackendAPI, prometheusAPI, grafanaAPI].forEach(api => {
  api.interceptors.response.use(
    response => response,
    errorInterceptor
  );
});

export default {
  nodeBackendAPI,
  pythonBackendAPI,
  prometheusAPI,
  grafanaAPI,
};
