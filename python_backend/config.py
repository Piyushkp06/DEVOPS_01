from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    node_backend_url: str = os.getenv("NODE_BACKEND_URL", "http://localhost:3000/api")
    port: int = int(os.getenv("PORT", "8000"))
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()