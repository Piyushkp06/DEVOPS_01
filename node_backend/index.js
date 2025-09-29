const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'DevOps Node.js Backend is running!' });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'node_backend',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        service: 'node_backend',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Proxy endpoint to Python backend
app.get('/api/python/status', async (req, res) => {
    try {
        const response = await axios.get(`${process.env.PYTHON_BACKEND_URL}/api/status`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to connect to Python backend',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js Backend running on port ${PORT}`);
});

module.exports = app;
