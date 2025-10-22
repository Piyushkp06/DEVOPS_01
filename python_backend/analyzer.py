from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import httpx
from groq import Groq
from datetime import datetime
from config import settings
from prometheus_client import Counter, Histogram, Gauge
import time

# Use APIRouter instead of FastAPI
router = APIRouter()

# Prometheus metrics
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

groq_api_calls = Counter(
    'groq_api_calls_total',
    'Total number of Groq API calls',
    ['status']
)

groq_api_duration = Histogram(
    'groq_api_duration_seconds',
    'Time spent calling Groq API'
)

active_analyses = Gauge(
    'active_ai_analyses',
    'Number of AI analyses currently in progress'
)

data_fetch_duration = Histogram(
    'data_fetch_duration_seconds',
    'Time spent fetching data from Node backend',
    ['endpoint']
)

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
    source: str = Field(..., description="Data source: 'logs', 'incidents', 'services', 'deployments', 'actions', 'comprehensive'")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters for the query")
    context: Optional[str] = Field(None, description="Additional context for analysis")
    deep_analysis: Optional[bool] = Field(False, description="Fetch related data across logs → incidents → services → actions")

class AnalysisResponse(BaseModel):
    timestamp: str
    source: str
    analysis: str
    data_analyzed: Any
    recommendations: Optional[List[str]] = None
    related_data: Optional[Dict[str, Any]] = None

async def fetch_comprehensive_data(error_log_id: Optional[str] = None, incident_id: Optional[str] = None):
    """
    Fetch comprehensive data across the entire chain:
    Error Log → Related Incident → Associated Service → Actions Taken
    """
    base_url = settings.node_backend_url
    comprehensive_data = {
        "log": None,
        "incident": None,
        "service": None,
        "actions": [],
        "related_logs": [],
    }
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            # If we have a log ID, start from there
            if error_log_id:
                # 1. Fetch the specific log
                log_response = await http_client.get(f"{base_url}/logs/{error_log_id}")
                if log_response.status_code == 200:
                    comprehensive_data["log"] = log_response.json().get("data")
                    
                    # Extract service info from log to find related incidents
                    log_data = comprehensive_data["log"]
                    service_name = log_data.get("service")
                    
                    # 2. Find incidents related to this service
                    incidents_response = await http_client.get(
                        f"{base_url}/incidents",
                        params={"serviceName": service_name, "limit": 5}
                    )
                    if incidents_response.status_code == 200:
                        incidents_data = incidents_response.json().get("data", {})
                        incidents = incidents_data.get("incidents", [])
                        if incidents:
                            incident_id = incidents[0].get("id")
            
            # If we have an incident ID
            if incident_id:
                # 3. Fetch incident details
                incident_response = await http_client.get(f"{base_url}/incidents/{incident_id}")
                if incident_response.status_code == 200:
                    comprehensive_data["incident"] = incident_response.json().get("data")
                    
                    incident_data = comprehensive_data["incident"]
                    service_id = incident_data.get("serviceId")
                    
                    # 4. Fetch service details
                    if service_id:
                        service_response = await http_client.get(f"{base_url}/services/{service_id}")
                        if service_response.status_code == 200:
                            comprehensive_data["service"] = service_response.json().get("data")
                    
                    # 5. Fetch all actions taken for this incident
                    actions_response = await http_client.get(
                        f"{base_url}/actions/incident/{incident_id}"
                    )
                    if actions_response.status_code == 200:
                        actions_data = actions_response.json().get("data", {})
                        comprehensive_data["actions"] = actions_data.get("actions", [])
                    
                    # 6. Fetch related logs for the service
                    if service_id:
                        related_logs_response = await http_client.get(
                            f"{base_url}/logs",
                            params={"serviceId": service_id, "level": "error", "limit": 10}
                        )
                        if related_logs_response.status_code == 200:
                            logs_data = related_logs_response.json().get("data", {})
                            comprehensive_data["related_logs"] = logs_data.get("logs", [])
            
            return comprehensive_data
            
        except Exception as e:
            print(f"Error fetching comprehensive data: {e}")
            return comprehensive_data

async def fetch_from_node_backend(source: str, filters: Optional[Dict] = None):
    """Fetch data from Node backend API with proper route handling"""
    base_url = settings.node_backend_url
    
    # Map sources to correct endpoints
    endpoint_map = {
        "logs": "/logs",
        "incidents": "/incidents",
        "services": "/services",
        "deployments": "/deployments",
        "actions": "/actions",
    }
    
    url = f"{base_url}{endpoint_map.get(source, f'/{source}')}"
    
    fetch_start = time.time()
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        try:
            response = await http_client.get(url, params=filters or {})
            response.raise_for_status()
            data_fetch_duration.labels(endpoint=source).observe(time.time() - fetch_start)
            
            # Extract data from nested response structure
            json_response = response.json()
            if isinstance(json_response, dict) and "data" in json_response:
                data = json_response["data"]
                # Handle pagination structure
                if isinstance(data, dict) and source in ["logs", "incidents", "actions"]:
                    return data.get(source, [])
                return data
            return json_response
            
        except httpx.HTTPStatusError as e:
            data_fetch_duration.labels(endpoint=source).observe(time.time() - fetch_start)
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Node backend error: {e.response.text}"
            )
        except httpx.RequestError as e:
            data_fetch_duration.labels(endpoint=source).observe(time.time() - fetch_start)
            raise HTTPException(
                status_code=503,
                detail=f"Failed to connect to Node backend: {str(e)}"
            )
        except Exception as e:
            data_fetch_duration.labels(endpoint=source).observe(time.time() - fetch_start)
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )

def build_comprehensive_analysis_prompt(comprehensive_data: Dict, context: Optional[str] = None) -> str:
    """Build an advanced prompt for comprehensive analysis across the entire incident chain"""
    
    prompt = f"""You are an expert DevOps AI Agent with deep expertise in incident response, root cause analysis, and system reliability engineering.

**MISSION: End-to-End Incident Analysis & Resolution**

You have been provided with comprehensive data spanning the entire incident lifecycle:
- Error logs that triggered the issue
- Related incidents and their status
- Affected service configuration and health
- Actions already taken by the team
- Historical context from related logs

**YOUR TASK:**

1. **INCIDENT CHAIN ANALYSIS**
   - Trace the error from initial log entry through incident creation to current state
   - Identify if this is a recurring issue or a new problem
   - Determine the blast radius (how many services/users affected)

2. **ROOT CAUSE DETERMINATION**
   - Analyze error patterns across related logs
   - Examine service configuration and deployment history
   - Review actions already attempted and their results
   - Identify the PRIMARY root cause (not just symptoms)

3. **SEVERITY & IMPACT ASSESSMENT**
   - Critical: Service down, data loss risk, security breach
   - High: Major functionality impaired, performance degraded >50%
   - Medium: Minor functionality issues, some users affected
   - Low: Cosmetic issues, no user impact

4. **RESOLUTION STRATEGY**
   - Immediate actions (stop the bleeding)
   - Short-term fixes (restore service)
   - Long-term preventive measures
   - Specific commands to run (if applicable)

5. **LEARNING & PREVENTION**
   - What monitoring alerts should be added?
   - What architectural changes would prevent recurrence?
   - Should this trigger a post-mortem?

**DATA PROVIDED:**

"""
    
    # Add log data
    if comprehensive_data.get("log"):
        log = comprehensive_data["log"]
        prompt += f"""
**PRIMARY ERROR LOG:**
- Level: {log.get('level', 'N/A')}
- Service: {log.get('service', 'N/A')}
- Message: {log.get('message', 'N/A')}
- Timestamp: {log.get('timestamp', 'N/A')}
- Stack Trace: {log.get('stackTrace', 'N/A')[:500] if log.get('stackTrace') else 'None'}
"""
    
    # Add incident data
    if comprehensive_data.get("incident"):
        incident = comprehensive_data["incident"]
        prompt += f"""
**RELATED INCIDENT:**
- ID: {incident.get('id', 'N/A')}
- Title: {incident.get('title', 'N/A')}
- Severity: {incident.get('severity', 'N/A')}
- Status: {incident.get('status', 'N/A')}
- Description: {incident.get('description', 'N/A')}
- Reported: {incident.get('reportedAt', 'N/A')}
- Resolved: {incident.get('resolvedAt', 'N/A')}
"""
    
    # Add service data
    if comprehensive_data.get("service"):
        service = comprehensive_data["service"]
        prompt += f"""
**AFFECTED SERVICE:**
- Name: {service.get('name', 'N/A')}
- Status: {service.get('status', 'N/A')}
- URL: {service.get('url', 'N/A')}
- Health Check: {service.get('healthCheckUrl', 'N/A')}
- Last Updated: {service.get('updatedAt', 'N/A')}
"""
    
    # Add actions taken
    if comprehensive_data.get("actions"):
        actions = comprehensive_data["actions"]
        prompt += f"""
**ACTIONS ALREADY TAKEN ({len(actions)} total):**
"""
        for i, action in enumerate(actions[:5], 1):  # Show up to 5 actions
            prompt += f"""
Action {i}:
  - Command: {action.get('commandRun', 'N/A')}
  - Result: {action.get('result', 'N/A')}
  - Timestamp: {action.get('timestamp', 'N/A')}
"""
    
    # Add related logs
    if comprehensive_data.get("related_logs"):
        related_logs = comprehensive_data["related_logs"]
        prompt += f"""
**RELATED ERROR LOGS ({len(related_logs)} found):**
"""
        for i, log in enumerate(related_logs[:3], 1):  # Show up to 3
            prompt += f"""
Log {i}: [{log.get('level')}] {log.get('message', 'N/A')[:100]}...
"""
    
    if context:
        prompt += f"\n**ADDITIONAL CONTEXT:** {context}\n"
    
    prompt += """

**YOUR RESPONSE MUST INCLUDE:**

## 🔴 SEVERITY: [Critical/High/Medium/Low]

## 🔍 ROOT CAUSE ANALYSIS
[Detailed explanation of what's causing the issue]

## 💥 IMPACT ASSESSMENT
- Users Affected: 
- Services Down: 
- Data at Risk: 

## ⚡ IMMEDIATE ACTIONS REQUIRED
1. [Specific command or action]
2. [Specific command or action]
3. [Specific command or action]

## 🔧 RESOLUTION STEPS
### Short-term Fix:
[Steps to restore service]

### Long-term Solution:
[Steps to prevent recurrence]

## 📊 RECOMMENDED COMMANDS
```bash
# Commands to run for diagnosis
[specific commands]

# Commands to fix the issue
[specific commands]
```

## 🛡️ PREVENTION STRATEGY
- Monitoring improvements
- Architecture changes
- Alert configurations

## ✅ VERIFICATION STEPS
1. [How to verify the fix worked]
2. [What metrics to monitor]

Be specific, actionable, and prioritize by urgency. Think like an SRE responding to a production incident.
"""
    
    return prompt

def build_analysis_prompt(source: str, data: Any, context: Optional[str] = None) -> str:
    """Build a standard analysis prompt for single-source data"""
    
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
    - {"source": "comprehensive", "filters": {"incidentId": "xxx"}, "deep_analysis": true}
    """
    
    start_time = time.time()
    active_analyses.inc()
    
    try:
        related_data = None
        
        # Handle comprehensive deep analysis
        if request.deep_analysis or request.source == "comprehensive":
            # Extract IDs from filters
            log_id = request.filters.get("logId") if request.filters else None
            incident_id = request.filters.get("incidentId") if request.filters else None
            
            if not log_id and not incident_id:
                ai_analysis_requests.labels(source=request.source, status='error').inc()
                raise HTTPException(
                    status_code=400,
                    detail="For deep analysis, provide either 'logId' or 'incidentId' in filters"
                )
            
            # Fetch comprehensive data across the entire chain
            comprehensive_data = await fetch_comprehensive_data(log_id, incident_id)
            related_data = comprehensive_data
            
            if not any(comprehensive_data.values()):
                ai_analysis_requests.labels(source=request.source, status='no_data').inc()
                return AnalysisResponse(
                    timestamp=datetime.utcnow().isoformat(),
                    source="comprehensive",
                    analysis="No data found for the provided IDs.",
                    data_analyzed={},
                    related_data=comprehensive_data
                )
            
            # Check if AI is available
            if not client:
                ai_analysis_requests.labels(source=request.source, status='unavailable').inc()
                return AnalysisResponse(
                    timestamp=datetime.utcnow().isoformat(),
                    source="comprehensive",
                    analysis="⚠️ **AI Analysis Unavailable**\n\nGroq API key not configured. Data retrieved successfully.",
                    data_analyzed=comprehensive_data,
                    related_data=comprehensive_data,
                    recommendations=["Configure GROQ_API_KEY environment variable"]
                )
            
            # Build comprehensive prompt
            prompt = build_comprehensive_analysis_prompt(comprehensive_data, request.context)
            data = comprehensive_data
            
        else:
            # Standard single-source analysis
            data = await fetch_from_node_backend(request.source, request.filters)
            
            if not data:
                ai_analysis_requests.labels(source=request.source, status='no_data').inc()
                return AnalysisResponse(
                    timestamp=datetime.utcnow().isoformat(),
                    source=request.source,
                    analysis="No data available for analysis.",
                    data_analyzed=[],
                    recommendations=[]
                )
            
            if not client:
                ai_analysis_requests.labels(source=request.source, status='unavailable').inc()
                return AnalysisResponse(
                    timestamp=datetime.utcnow().isoformat(),
                    source=request.source,
                    analysis="⚠️ **AI Analysis Unavailable**\n\nGroq API key not configured.",
                    data_analyzed=data,
                    recommendations=["Configure GROQ_API_KEY environment variable"]
                )
            
            prompt = build_analysis_prompt(request.source, data, request.context)
        
        # Get AI analysis from Groq with metrics tracking
        groq_start = time.time()
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert DevOps SRE and incident response specialist. Provide detailed, actionable analysis with specific commands and steps."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=3000  # Increased for comprehensive analysis
            )
            groq_api_calls.labels(status='success').inc()
            groq_api_duration.observe(time.time() - groq_start)
        except Exception as groq_error:
            groq_api_calls.labels(status='error').inc()
            raise groq_error
        
        analysis_result = completion.choices[0].message.content
        
        # Record successful analysis
        ai_analysis_requests.labels(source=request.source, status='success').inc()
        ai_analysis_duration.labels(source=request.source).observe(time.time() - start_time)
        
        return AnalysisResponse(
            timestamp=datetime.utcnow().isoformat(),
            source=request.source if not request.deep_analysis else "comprehensive",
            analysis=analysis_result,
            data_analyzed=data,
            related_data=related_data
        )
        
    except HTTPException:
        ai_analysis_requests.labels(source=request.source, status='error').inc()
        raise
    except Exception as e:
        ai_analysis_requests.labels(source=request.source, status='error').inc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        active_analyses.dec()
        ai_analysis_duration.labels(source=request.source).observe(time.time() - start_time)

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