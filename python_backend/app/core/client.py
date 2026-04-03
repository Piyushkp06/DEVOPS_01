"""
Groq AI client initialization
"""
from groq import AsyncGroq
from app.core.config import settings


def initialize_groq_client() -> AsyncGroq | None:
    """
    Initialize Groq client with error handling
    
    Returns:
        Groq client instance or None if initialization fails
    """
    try:
        if not settings.groq_api_key:
            print("Warning: GROQ_API_KEY not set. AI analysis will be unavailable.")
            return None
        
        client = AsyncGroq(api_key=settings.groq_api_key)
        print("✓ Groq client initialized successfully")
        return client
    except Exception as e:
        print(f"Warning: Groq client initialization failed: {e}")
        return None


# Initialize client on module import
client = initialize_groq_client()
