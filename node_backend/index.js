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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'DevOps Node.js Backend is running!' });
});



// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/logs", logRoutes);


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js Backend running on port ${PORT}`);
});

export default app;
