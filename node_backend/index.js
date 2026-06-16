import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import deploymentRoutes from './routes/deploymentRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';
import { register } from './utils/metrics.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  process.env.PYTHON_BACKEND_URL || "http://localhost:8000",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000"
]; 

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Metrics middleware (before routes)
app.use(metricsMiddleware);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'DevOps Node.js Backend is running!',
        metrics: '/metrics',
        health: '/health'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});



// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/logs", logRoutes);


app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 DevOps Node.js Backend');
    console.log('='.repeat(60));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log('='.repeat(60) + '\n');
});

export default app;
