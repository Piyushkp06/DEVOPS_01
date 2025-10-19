import httpx
import asyncio

async def test_analyze():
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Test main health
        print("Testing main health endpoint...")
        response = await client.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")
        
        # Test AI health
        print("Testing AI health endpoint...")
        response = await client.get(f"{base_url}/api/ai/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}\n")
        
        # Test analyze endpoint
        print("Testing analyze endpoint...")
        response = await client.post(
            f"{base_url}/api/ai/analyze",
            json={
                "source": "logs",
                "filters": {"level": "error"},
                "context": "Production environment"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    asyncio.run(test_analyze())