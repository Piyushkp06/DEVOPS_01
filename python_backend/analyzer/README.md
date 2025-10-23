# Analyzer Module

AI-powered DevOps analysis module for logs, incidents, services, and comprehensive incident chain analysis using Groq AI.

## Architecture

```
analyzer/
├── __init__.py                    # Module exports (router, models, client)
├── models.py                      # Pydantic models (AnalyzeRequest, AnalysisResponse)
├── client.py                      # Groq AI client initialization
├── routes.py                      # API endpoints (/analyze, /health, /)
├── prompts.py                     # Prompt building utilities
├── metrics/
│   └── __init__.py               # Prometheus metrics definitions
└── services/
    ├── __init__.py               # Service layer exports
    ├── data_fetcher.py           # Node backend data fetching
    └── analyzer.py               # Main analysis orchestration logic
```

## Module Breakdown

### models.py
Defines the Pydantic models for request/response:
- `AnalyzeRequest`: Input model for analysis requests
- `AnalysisResponse`: Output model with analysis results

### client.py
Handles Groq AI client initialization with proper error handling.
- `initialize_groq_client()`: Initialize Groq client safely
- `client`: Global client instance

### routes.py
FastAPI routes for the analyzer:
- `POST /analyze`: Main analysis endpoint
- `GET /health`: Health check
- `GET /`: Service information

### prompts.py
AI prompt construction utilities:
- `build_comprehensive_analysis_prompt()`: For deep incident chain analysis
- `build_analysis_prompt()`: For single-source data analysis

### metrics/__init__.py
Prometheus metrics for monitoring:
- `ai_analysis_requests`: Request counter by source and status
- `ai_analysis_duration`: Analysis duration histogram
- `groq_api_calls`: Groq API call counter
- `groq_api_duration`: Groq API latency
- `active_analyses`: Active analysis gauge
- `data_fetch_duration`: Data fetching latency

### services/data_fetcher.py
Data fetching from Node.js backend:
- `fetch_comprehensive_data()`: Fetch entire incident chain
- `fetch_from_node_backend()`: Fetch single-source data

### services/analyzer.py
Main analysis orchestration:
- `perform_analysis()`: Main entry point for analysis
- `_handle_comprehensive_analysis()`: Deep analysis handler
- `_handle_standard_analysis()`: Standard analysis handler
- `_get_groq_analysis()`: Groq API wrapper

## Usage

### In main.py
```python
from analyzer import router as analyzer_router

app.include_router(analyzer_router, prefix="/api/ai", tags=["AI Analysis"])
```

### API Examples

#### Standard Analysis
```bash
curl -X POST http://localhost:8000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "source": "logs",
    "filters": {"level": "error", "limit": 10}
  }'
```

#### Comprehensive Analysis
```bash
curl -X POST http://localhost:8000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "source": "comprehensive",
    "deep_analysis": true,
    "filters": {"incidentId": "abc123"}
  }'
```

## Benefits of This Architecture

✓ **Separation of Concerns**: Each file has a single, clear responsibility
✓ **Testability**: Individual components can be tested in isolation
✓ **Maintainability**: Easy to find and modify specific functionality
✓ **Scalability**: New features can be added without touching existing code
✓ **Type Safety**: Pydantic models provide validation and type hints
✓ **Monitoring**: Prometheus metrics built into each layer

## Migration Notes

The old monolithic `analyzer.py` (582 lines) has been refactored into this modular structure. The backward compatibility layer (`analyzer.py` in the root) ensures no breaking changes.

Old imports still work:
```python
from analyzer import router  # Still works!
```

## Dependencies

- FastAPI
- Pydantic
- Groq Python SDK
- httpx (async HTTP client)
- prometheus-client
