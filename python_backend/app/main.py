from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import uvicorn
from app.api.routes import router as analyzer_router
from app.utils.kafka_client import kafka_manager
from app.services.autonomous_agent import autonomous_agent

app = FastAPI(
    title="DevOps AI Platform",
    description="AI-powered DevOps monitoring and incident management",
    version="1.0.0"
)

# Initialize Prometheus metrics
Instrumentator().instrument(app).expose(app)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analyzer routes
app.include_router(analyzer_router, prefix="/api/ai", tags=["AI Analysis"])

@app.on_event("startup")
async def startup_event():
    kafka_manager.connect_producer()
    autonomous_agent.start_listening()

@app.get("/")
async def root():
    return {
        "service": "DevOps AI Platform",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "GET /": "Platform information",
            "GET /health": "Platform health check",
            "GET /docs": "API documentation (Swagger UI)",
            "GET /api/ai/": "AI agent information",
            "GET /api/ai/health": "AI agent health check",
            "POST /api/ai/analyze": "AI analysis for logs, incidents, services, deployments"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "DevOps AI Platform",
        "components": {
            "api": "running",
            "ai_agent": "available"
        }
    }

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting DevOps AI Platform")
    print("=" * 60)
    print(f"📍 Server: http://localhost:8000")
    print(f"📚 API Docs: http://localhost:8000/docs")
    print(f"🤖 AI Agent: http://localhost:8000/api/ai")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Changed from localhost to 127.0.0.1
        port=8000,
        reload=True
    )