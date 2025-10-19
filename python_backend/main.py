from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from analyzer import router as analyzer_router

app = FastAPI(
    title="DevOps AI Platform",
    description="AI-powered DevOps monitoring and incident management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analyzer routes
app.include_router(analyzer_router, prefix="/api/ai", tags=["AI Analysis"])

@app.get("/")
async def root():
    return {
        "service": "DevOps AI Platform",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "POST /api/ai/analyze": "AI analysis for logs, incidents, services",
            "GET /api/ai/health": "Health check",
            "GET /docs": "API documentation"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "DevOps AI Platform"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )