"""
API routes for AI analysis endpoints
"""
from fastapi import APIRouter
from datetime import datetime

from analyzer.models import AnalyzeRequest, AnalysisResponse
from analyzer.services.analyzer import perform_analysis
from analyzer.client import client
from config import settings


router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze logs, incidents, services, or deployments from Node backend
    
    Examples:
    - {"source": "logs", "filters": {"level": "error"}}
    - {"source": "incidents", "filters": {"status": "open"}}
    - {"source": "comprehensive", "filters": {"incidentId": "xxx"}, "deep_analysis": true}
    """
    return await perform_analysis(request)


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DevOps AI Agent",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_configured": bool(client),
        "node_backend": settings.node_backend_url,
        "features": {
            "single_source_analysis": True,
            "comprehensive_analysis": True,
            "incident_chain_tracking": True
        }
    }


@router.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "DevOps AI Agent",
        "version": "2.0.0",
        "endpoints": {
            "POST /analyze": "Analyze logs, incidents, services, deployments, or comprehensive incident chains",
            "GET /health": "Health check"
        },
        "analysis_modes": {
            "standard": "Analyze single data source (logs, incidents, services, etc.)",
            "comprehensive": "Deep analysis across logs → incidents → services → actions chain"
        },
        "groq_status": "configured" if client else "not_configured"
    }
