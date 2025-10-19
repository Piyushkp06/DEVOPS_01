from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import httpx
from groq import Groq
from datetime import datetime
from config import settings

# Use APIRouter instead of FastAPI
router = APIRouter()

# Initialize Groq client with error handling
try:
    if not settings.groq_api_key:
        print("Warning: GROQ_API_KEY not set. AI analysis will be unavailable.")
        client = None
    else:
        client = Groq(api_key=settings.groq_api_key)
        print("✓ Groq client initialized successfully")
except Exception as e:
    print(f"Warning: Groq client initialization failed: {e}")
    client = None

class AnalyzeRequest(BaseModel):
    source: str = Field(..., description="Data source: 'logs', 'incidents', 'services', 'deployments'")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters for the query")
    context: Optional[str] = Field(None, description="Additional context for analysis")

class AnalysisResponse(BaseModel):
    timestamp: str
    source: str
    analysis: str
    data_analyzed: Any
    recommendations: Optional[List[str]] = None

async def fetch_from_node_backend(source: str, filters: Optional[Dict] = None):
    """Fetch data from Node backend API"""
    url = f"{settings.node_backend_url}/{source}"
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(url, params=filters or {})
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Node backend error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to connect to Node backend: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )

def build_analysis_prompt(source: str, data: Any, context: Optional[str] = None) -> str:
    """Build a comprehensive prompt for the AI agent"""
    
    base_prompt = f"""You are an expert DevOps AI Agent specializing in application reliability, performance optimization, and incident management.

Your mission: Analyze the following {source} data and provide actionable insights to help developers maintain robust, high-performing applications.

**Analysis Framework:**

1. **ASSESSMENT**
   - Scan for errors, warnings, anomalies, and performance degradation
   - Evaluate severity levels (Critical, High, Medium, Low)
   - Identify patterns and trends

2. **ROOT CAUSE ANALYSIS**
   - Determine likely root causes for each issue
   - Consider common failure modes: resource exhaustion, configuration errors, code bugs, dependency failures, network issues
   - Look for cascading failures or systemic problems

3. **IMPACT EVALUATION**
   - Assess impact on users, services, and business operations
   - Identify affected components and dependencies

4. **RECOMMENDATIONS**
   - Provide specific, actionable remediation steps
   - Suggest preventive measures and monitoring improvements
   - Recommend infrastructure or code changes if applicable
   - Prioritize actions by urgency

5. **HEALTH CHECK**
   - If no critical issues found, confirm system health status
   - Highlight any minor optimizations or best practices

**Response Format:**
Structure your response with clear sections using markdown:
- 🔴 **Critical Issues**
- ⚠️ **Warnings & Anomalies**
- 🔍 **Root Cause Analysis**
- 💡 **Recommended Actions**
- 📊 **System Health Summary**

"""
    
    if context:
        base_prompt += f"\n**Additional Context Provided:**\n{context}\n"
    
    base_prompt += f"\n**Data to Analyze ({source}):**\n```json\n{data}\n```\n"
    
    return base_prompt

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze logs, incidents, services, or deployments from Node backend
    
    Examples:
    - {"source": "logs", "filters": {"level": "error"}}
    - {"source": "incidents", "filters": {"status": "open"}}
    - {"source": "services", "context": "Production environment"}
    """
    
    try:
        # Fetch data from Node backend
        data = await fetch_from_node_backend(request.source, request.filters)
        
        if not data:
            return AnalysisResponse(
                timestamp=datetime.utcnow().isoformat(),
                source=request.source,
                analysis="No data available for analysis.",
                data_analyzed=[],
                recommendations=[]
            )
        
        # Check if Groq client is available
        if not client:
            return AnalysisResponse(
                timestamp=datetime.utcnow().isoformat(),
                source=request.source,
                analysis="⚠️ **AI Analysis Unavailable**\n\nGroq API key not configured. Please set GROQ_API_KEY in your .env file to enable AI-powered analysis.\n\nData retrieved successfully from Node backend.",
                data_analyzed=data,
                recommendations=["Configure GROQ_API_KEY environment variable"]
            )
        
        # Build comprehensive prompt
        prompt = build_analysis_prompt(request.source, data, request.context)
        
        # Get AI analysis from Groq
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert DevOps AI assistant. Provide detailed, actionable analysis."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=2048
        )
        
        analysis_result = completion.choices[0].message.content
        
        return AnalysisResponse(
            timestamp=datetime.utcnow().isoformat(),
            source=request.source,
            analysis=analysis_result,
            data_analyzed=data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DevOps AI Agent",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_configured": bool(client),
        "node_backend": settings.node_backend_url
    }

@router.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "DevOps AI Agent",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyze": "Analyze logs, incidents, services, or deployments",
            "GET /health": "Health check"
        },
        "groq_status": "configured" if client else "not_configured"
    }