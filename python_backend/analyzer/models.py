"""
Pydantic models for AI analysis requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class AnalyzeRequest(BaseModel):
    """Request model for AI analysis"""
    source: str = Field(
        ..., 
        description="Data source: 'logs', 'incidents', 'services', 'deployments', 'actions', 'comprehensive'"
    )
    filters: Optional[Dict[str, Any]] = Field(
        None, 
        description="Optional filters for the query"
    )
    context: Optional[str] = Field(
        None, 
        description="Additional context for analysis"
    )
    deep_analysis: Optional[bool] = Field(
        False, 
        description="Fetch related data across logs → incidents → services → actions"
    )


class AnalysisResponse(BaseModel):
    """Response model for AI analysis"""
    timestamp: str
    source: str
    analysis: str
    data_analyzed: Any
    recommendations: Optional[List[str]] = None
    related_data: Optional[Dict[str, Any]] = None
