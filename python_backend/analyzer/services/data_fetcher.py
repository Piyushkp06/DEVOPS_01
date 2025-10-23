"""
Data fetching services for Node backend integration
"""
import httpx
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException
from config import settings
from analyzer.metrics import data_fetch_duration


async def fetch_comprehensive_data(
    error_log_id: Optional[str] = None, 
    incident_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch comprehensive data across the entire chain:
    Error Log → Related Incident → Associated Service → Actions Taken
    
    Args:
        error_log_id: Optional log ID to start the chain from
        incident_id: Optional incident ID to start the chain from
        
    Returns:
        Dict containing log, incident, service, actions, and related_logs
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


async def fetch_from_node_backend(
    source: str, 
    filters: Optional[Dict] = None
) -> Any:
    """
    Fetch data from Node backend API with proper route handling
    
    Args:
        source: Data source type (logs, incidents, services, etc.)
        filters: Optional query parameters
        
    Returns:
        Fetched data from the backend
        
    Raises:
        HTTPException: If request fails
    """
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
