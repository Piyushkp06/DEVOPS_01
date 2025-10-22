import { httpRequestDuration, httpRequestTotal, activeConnections } from '../utils/metrics.js';

export const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    
    // Record metrics
    httpRequestDuration.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    // Decrement active connections
    activeConnections.dec();

    return originalSend.call(this, data);
  };

  next();
};
