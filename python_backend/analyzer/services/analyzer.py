"""
AI analysis service using Groq
"""
import time
from typing import Dict, Any
from datetime import datetime
from fastapi import HTTPException

from analyzer.client import client
from analyzer.models import AnalyzeRequest, AnalysisResponse
from analyzer.prompts import build_comprehensive_analysis_prompt, build_analysis_prompt
from analyzer.services.data_fetcher import fetch_comprehensive_data, fetch_from_node_backend
from analyzer.metrics import (
    ai_analysis_requests,
    ai_analysis_duration,
    groq_api_calls,
    groq_api_duration,
    active_analyses
)


async def perform_analysis(request: AnalyzeRequest) -> AnalysisResponse:
    """
    Main analysis function that orchestrates data fetching and AI analysis
    
    Args:
        request: AnalyzeRequest containing source, filters, context, and deep_analysis flag
        
    Returns:
        AnalysisResponse with AI-generated analysis and data
        
    Raises:
        HTTPException: If analysis fails
    """
    start_time = time.time()
    active_analyses.inc()
    
    try:
        related_data = None
        
        # Handle comprehensive deep analysis
        if request.deep_analysis or request.source == "comprehensive":
            data, related_data, prompt = await _handle_comprehensive_analysis(request)
            
        else:
            # Standard single-source analysis
            data, prompt = await _handle_standard_analysis(request)
        
        # Check if AI is available
        if not client:
            ai_analysis_requests.labels(source=request.source, status='unavailable').inc()
            return AnalysisResponse(
                timestamp=datetime.utcnow().isoformat(),
                source=request.source if not request.deep_analysis else "comprehensive",
                analysis="⚠️ **AI Analysis Unavailable**\n\nGroq API key not configured. Data retrieved successfully.",
                data_analyzed=data,
                related_data=related_data,
                recommendations=["Configure GROQ_API_KEY environment variable"]
            )
        
        # Get AI analysis from Groq with metrics tracking
        analysis_result = await _get_groq_analysis(prompt, request.source)
        
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


async def _handle_comprehensive_analysis(request: AnalyzeRequest) -> tuple[Dict, Dict, str]:
    """
    Handle comprehensive deep analysis across incident chain
    
    Returns:
        Tuple of (data, related_data, prompt)
    """
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
        raise HTTPException(
            status_code=404,
            detail="No data found for the provided IDs"
        )
    
    # Build comprehensive prompt
    prompt = build_comprehensive_analysis_prompt(comprehensive_data, request.context)
    
    return comprehensive_data, related_data, prompt


async def _handle_standard_analysis(request: AnalyzeRequest) -> tuple[Any, str]:
    """
    Handle standard single-source analysis
    
    Returns:
        Tuple of (data, prompt)
    """
    data = await fetch_from_node_backend(request.source, request.filters)
    
    if not data:
        ai_analysis_requests.labels(source=request.source, status='no_data').inc()
        raise HTTPException(
            status_code=404,
            detail="No data available for analysis"
        )
    
    prompt = build_analysis_prompt(request.source, data, request.context)
    
    return data, prompt


async def _get_groq_analysis(prompt: str, source: str) -> str:
    """
    Get AI analysis from Groq API
    
    Args:
        prompt: The formatted prompt to send
        source: Data source for metrics
        
    Returns:
        Analysis result string
        
    Raises:
        Exception: If Groq API call fails
    """
    if not client:
        raise Exception("Groq client not initialized")
    
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
        
        return completion.choices[0].message.content
        
    except Exception as groq_error:
        groq_api_calls.labels(status='error').inc()
        groq_api_duration.observe(time.time() - groq_start)
        raise groq_error
