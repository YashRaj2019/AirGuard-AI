import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml-service"))

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def unwrap(resp_json):
    """Helper to unwrap ApiResponse envelope data if present."""
    if isinstance(resp_json, dict) and "data" in resp_json:
        return resp_json["data"]
    return resp_json

def test_ml_service():
    print("1. Testing /health...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    print("   Status:", health_data.get("status"))
    print("   Service:", health_data.get("service"))

    print("\n2. Testing /api/ml/model-performance...")
    resp = client.get("/api/ml/model-performance")
    assert resp.status_code == 200, f"Model performance failed: {resp.text}"
    perf = unwrap(resp.json())
    assert "best_model" in perf, f"Missing best_model in {perf}"
    print("   Best model:", perf.get("best_model"))
    print("   Models evaluated:", list(perf.get("models", {}).keys()))

    print("\n3. Testing /api/ml/predict...")
    payload = {
        "city": "Delhi",
        "pm25": 92.5,
        "pm10": 160.0,
        "no2": 42.0,
        "so2": 14.0,
        "co": 1.9,
        "o3": 38.0,
        "temperature": 27.0,
        "humidity": 60.0,
        "wind_speed": 7.5
    }
    resp = client.post("/api/ml/predict", json=payload)
    assert resp.status_code == 200, f"Predict failed: {resp.text}"
    pred = unwrap(resp.json())
    assert "city" in pred and "predicted_aqi" in pred, f"Invalid prediction payload: {pred}"
    print("   City:", pred["city"])
    print("   Predicted AQI:", pred["predicted_aqi"])
    print("   Category:", pred["aqi_category"])
    print("   Prediction Interval:", pred["prediction_interval"])
    print("   Model:", pred["model_name"])
    print("   Top Contributing Factors:")
    for f in pred["contributing_factors"][:3]:
        print(f"     - {f['feature']}: {f['importance']}%")

    print("\n4. Testing /api/cities...")
    resp = client.get("/api/cities")
    assert resp.status_code == 200, f"Get cities failed: {resp.text}"
    cities = unwrap(resp.json())
    assert isinstance(cities, list) and len(cities) > 0, "Cities list empty"
    print(f"   Fetched {len(cities)} monitoring stations successfully.")

    print("\n5. Testing /api/air-quality/current/Delhi...")
    resp = client.get("/api/air-quality/current/Delhi")
    assert resp.status_code == 200, f"Get current AQI failed: {resp.text}"
    current = unwrap(resp.json())
    assert "aqi" in current and "pm25" in current, "Invalid current AQI format"
    print(f"   Delhi Current AQI: {current.get('aqi')} ({current.get('aqiCategory')})")

    print("\n6. Testing /api/air-quality/trends/Delhi...")
    resp = client.get("/api/air-quality/trends/Delhi")
    assert resp.status_code == 200, f"Get trends failed: {resp.text}"
    trends = unwrap(resp.json())
    assert "dailySummaries" in trends or "dailyAverages" in trends, "Missing daily trends"
    print(f"   Delhi Trend Direction: {trends.get('trendDirection')}")

    print("\n7. Testing /api/ai/chat...")
    chat_payload = {
        "question": "Why is today's AQI high?",
        "selectedCity": "Delhi",
        "contextData": {
            "city": "Delhi",
            "currentAQI": current.get("aqi"),
            "category": current.get("aqiCategory"),
            "PM25": current.get("pm25"),
            "windSpeed": current.get("windSpeed")
        }
    }
    resp = client.post("/api/ai/chat", json=chat_payload)
    assert resp.status_code == 200, f"AI chat failed: {resp.text}"
    chat_res = unwrap(resp.json())
    assert "response" in chat_res or "reply" in chat_res, "Invalid chat response"
    print("   AI Chat generated grounded response successfully.")

    print("\nAll AirGuard AI FastAPI tests passed with 100% success!")

if __name__ == "__main__":
    test_ml_service()
