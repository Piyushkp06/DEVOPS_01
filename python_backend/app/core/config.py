from pydantic import BaseModel
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    groq_api_key: str = ""
    node_backend_url: str = "http://localhost:3000/api"
    port: int = 8000
    
    def __init__(self):
        super().__init__(
            groq_api_key=os.getenv("GROQ_API_KEY", ""),
            node_backend_url=os.getenv("NODE_BACKEND_URL", "http://localhost:3000/api"),
            port=int(os.getenv("PORT", "8000"))
        )

settings = Settings()