"""
Prometheus metrics for AI analysis tracking
"""
from prometheus_client import Counter, Histogram, Gauge


# AI Analysis Request Metrics
ai_analysis_requests = Counter(
    'ai_analysis_requests_total',
    'Total number of AI analysis requests',
    ['source', 'status']
)

ai_analysis_duration = Histogram(
    'ai_analysis_duration_seconds',
    'Time spent processing AI analysis',
    ['source']
)

# Groq API Metrics
groq_api_calls = Counter(
    'groq_api_calls_total',
    'Total number of Groq API calls',
    ['status']
)

groq_api_duration = Histogram(
    'groq_api_duration_seconds',
    'Time spent calling Groq API'
)

# Active Analysis Tracking
active_analyses = Gauge(
    'active_ai_analyses',
    'Number of AI analyses currently in progress'
)

# Data Fetching Metrics
data_fetch_duration = Histogram(
    'data_fetch_duration_seconds',
    'Time spent fetching data from Node backend',
    ['endpoint']
)
