# Analyzer Module - Architecture Overview

## 📁 File Structure

```
python_backend/
├── main.py                         # FastAPI app entry point
├── config.py                       # Configuration settings
├── analyzer.py                     # Backward compatibility layer
├── analyzer_old.py                 # Backup of original file
└── analyzer/                       # ✨ NEW MODULAR STRUCTURE
    ├── __init__.py                 # Module exports
    ├── README.md                   # Documentation
    ├── models.py                   # Data models
    ├── client.py                   # Groq AI client
    ├── routes.py                   # API endpoints
    ├── prompts.py                  # Prompt templates
    ├── metrics/
    │   └── __init__.py            # Prometheus metrics
    └── services/
        ├── __init__.py            # Service exports
        ├── data_fetcher.py        # Backend integration
        └── analyzer.py            # Analysis logic
```

## 🔄 Request Flow

```
Client Request
    ↓
main.py (FastAPI app)
    ↓
analyzer/routes.py (/analyze endpoint)
    ↓
analyzer/services/analyzer.py (perform_analysis)
    ↓
    ├─→ analyzer/services/data_fetcher.py (fetch data)
    │       ↓
    │   Node.js Backend API
    │       ↓
    │   PostgreSQL Database
    │
    ├─→ analyzer/prompts.py (build AI prompt)
    │
    └─→ analyzer/client.py (Groq AI)
            ↓
        Groq API (LLaMA 3.1)
            ↓
Response with AI Analysis
```

## 📊 Component Responsibilities

### 1. models.py (Data Layer)
```python
- AnalyzeRequest: Input validation
- AnalysisResponse: Output formatting
```

### 2. client.py (External Service)
```python
- Initialize Groq AI client
- Handle API key configuration
- Graceful failure handling
```

### 3. routes.py (API Layer)
```python
- POST /analyze: Main endpoint
- GET /health: Health check
- GET /: Service info
```

### 4. prompts.py (Business Logic)
```python
- build_comprehensive_analysis_prompt()
  └─ For deep incident chain analysis
- build_analysis_prompt()
  └─ For single-source data
```

### 5. metrics/__init__.py (Observability)
```python
- ai_analysis_requests (Counter)
- ai_analysis_duration (Histogram)
- groq_api_calls (Counter)
- groq_api_duration (Histogram)
- active_analyses (Gauge)
- data_fetch_duration (Histogram)
```

### 6. services/data_fetcher.py (Integration)
```python
- fetch_comprehensive_data()
  └─ Log → Incident → Service → Actions
- fetch_from_node_backend()
  └─ Single endpoint queries
```

### 7. services/analyzer.py (Orchestration)
```python
- perform_analysis()
  ├─ _handle_comprehensive_analysis()
  ├─ _handle_standard_analysis()
  └─ _get_groq_analysis()
```

## 🎯 Key Improvements

| Aspect | Before (Monolithic) | After (Modular) |
|--------|-------------------|----------------|
| **File Size** | 582 lines in 1 file | 10 files, max 234 lines |
| **Testing** | Hard to test | Easy to mock & test |
| **Maintenance** | Find code in 1 huge file | Clear file per concern |
| **Scalability** | Add to existing file | Add new files |
| **Readability** | Scroll through 582 lines | Navigate by concern |
| **Team Work** | Merge conflicts | Parallel development |

## 🚀 Usage Examples

### Standard Analysis
```python
from analyzer import router

# Already integrated in main.py
app.include_router(router, prefix="/api/ai")
```

### Testing Individual Components
```python
# Test data fetcher
from analyzer.services import fetch_from_node_backend
data = await fetch_from_node_backend("logs", {"level": "error"})

# Test prompt builder
from analyzer.prompts import build_analysis_prompt
prompt = build_analysis_prompt("logs", data)

# Test client
from analyzer.client import client
assert client is not None  # Groq configured
```

## 📈 Metrics Tracking

```python
# Automatic metrics for each analysis:
ai_analysis_requests_total{source="logs", status="success"} 42
ai_analysis_duration_seconds{source="logs"} 2.5
groq_api_calls_total{status="success"} 38
groq_api_duration_seconds 1.2
active_ai_analyses 0
data_fetch_duration_seconds{endpoint="logs"} 0.3
```

## ✅ Migration Checklist

- [x] Split models into models.py
- [x] Extract client initialization to client.py
- [x] Move Prometheus metrics to metrics/
- [x] Separate prompt logic to prompts.py
- [x] Create data_fetcher service
- [x] Create analyzer orchestration service
- [x] Define API routes in routes.py
- [x] Create module __init__.py with exports
- [x] Add backward compatibility layer
- [x] Test imports in main.py
- [x] Document architecture (README.md)
- [x] Backup old file (analyzer_old.py)

## 🔧 No Breaking Changes

The old import still works:
```python
from analyzer import router  # ✅ Works!
```

main.py doesn't need any changes:
```python
from analyzer import router as analyzer_router
app.include_router(analyzer_router, prefix="/api/ai", tags=["AI Analysis"])
```

## 📝 Next Steps

1. **Run tests**: Verify all endpoints work
2. **Check logs**: Ensure Groq client initializes
3. **Monitor metrics**: Validate Prometheus integration
4. **Test analysis**: Try comprehensive and standard modes
5. **Review**: Consider adding unit tests for each module
