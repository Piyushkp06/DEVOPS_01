import httpx
import asyncio
import json

async def test_comprehensive_analysis():
    base_url = "http://127.0.0.1:8000"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("\n" + "="*70)
        print("🧪 COMPREHENSIVE INCIDENT ANALYSIS TEST")
        print("="*70)
        
        # Test 1: Standard log analysis
        print("\n📋 Test 1: Standard Error Log Analysis")
        print("-" * 70)
        try:
            response = await client.post(
                f"{base_url}/api/ai/analyze",
                json={
                    "source": "logs",
                    "filters": {"level": "error", "limit": 5},
                    "context": "Production environment - investigating recent errors"
                }
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: {response.status_code}")
                print(f"📊 Logs analyzed: {len(result.get('data_analyzed', []))}")
                print(f"\n🤖 AI Analysis Preview:")
                print(result.get('analysis', '')[:300] + "...")
            else:
                print(f"❌ Status: {response.status_code}")
                print(f"Error: {response.json()}")
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        # Test 2: Comprehensive analysis with incident ID
        print("\n\n🔍 Test 2: Comprehensive Deep Analysis (Incident Chain)")
        print("-" * 70)
        try:
            response = await client.post(
                f"{base_url}/api/ai/analyze",
                json={
                    "source": "comprehensive",
                    "filters": {"incidentId": "some-incident-id"},  # Replace with actual ID
                    "deep_analysis": True,
                    "context": "Need full incident chain analysis with resolution steps"
                },
                timeout=90.0
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: {response.status_code}")
                print(f"\n📦 Related Data Retrieved:")
                related = result.get('related_data', {})
                print(f"  - Log: {'✅' if related.get('log') else '❌'}")
                print(f"  - Incident: {'✅' if related.get('incident') else '❌'}")
                print(f"  - Service: {'✅' if related.get('service') else '❌'}")
                print(f"  - Actions: {len(related.get('actions', []))} found")
                print(f"  - Related Logs: {len(related.get('related_logs', []))} found")
                
                print(f"\n🤖 Comprehensive AI Analysis:")
                print(result.get('analysis', '')[:500] + "...")
            else:
                print(f"❌ Status: {response.status_code}")
                print(f"Error: {response.json()}")
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        # Test 3: Service analysis
        print("\n\n🖥️  Test 3: Service Health Analysis")
        print("-" * 70)
        try:
            response = await client.post(
                f"{base_url}/api/ai/analyze",
                json={
                    "source": "services",
                    "filters": {"status": "active"},
                    "context": "Check overall service health"
                }
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: {response.status_code}")
                services = result.get('data_analyzed', [])
                print(f"📊 Services analyzed: {len(services)}")
                print(f"\n🤖 AI Analysis Preview:")
                print(result.get('analysis', '')[:300] + "...")
            else:
                print(f"❌ Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Test failed: {e}")
        
        print("\n" + "="*70)
        print("✅ ALL TESTS COMPLETED")
        print("="*70 + "\n")

if __name__ == "__main__":
    print("🚀 Starting Comprehensive Analysis Tests...")
    asyncio.run(test_comprehensive_analysis())