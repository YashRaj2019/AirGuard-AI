import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml-service"))

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_ml_service():
    print("Testing /health...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    print("Health response:", resp.json())

    print("\nTesting /api/ml/model-performance...")
    resp = client.get("/api/ml/model-performance")
    assert resp.status_code == 200, f"Model performance failed: {resp.text}"
    perf = resp.json()
    print("Best model:", perf.get("best_model"))
    print("Models evaluated:", list(perf.get("models", {}).keys()))

    print("\nTesting /api/ml/predict...")
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
    pred = resp.json()
    print("Prediction result:")
    print("  City:", pred["city"])
    print("  Predicted AQI:", pred["predicted_aqi"])
    print("  Category:", pred["aqi_category"])
    print("  Interval:", pred["prediction_interval"])
    print("  Model:", pred["model_name"])
    print("  Top Contributing Factors:")
    for f in pred["contributing_factors"][:3]:
        print(f"    - {f['feature']}: {f['importance']}%")

    print("\nAll FastAPI ML tests passed successfully!")

if __name__ == "__main__":
    test_ml_service()
