import os
import sys
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Header, Query, status, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure src is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db import init_db
from src.auth import RegisterRequest, LoginRequest, register_user, login_user, get_user_from_token
from src.model import AirGuardModelManager
from src.services import (
    get_all_cities,
    get_city_by_name,
    search_cities_external,
    locate_and_register,
    add_custom_city,
    get_current_air_quality,
    get_historical_records,
    get_trends,
    get_pollutant_breakdown,
    compare_cities,
    generate_ai_advisory,
    generate_ai_chat_response,
    get_user_favorites,
    add_user_favorite,
    remove_user_favorite
)

app = FastAPI(
    title="AirGuard AI — Unified Python Backend & ML Platform",
    description="Full-stack FastAPI backend for Environmental Intelligence, Machine Learning Regression, Real Telemetry, and User Authentication.",
    version="2.0.0"
)

# CORS configuration allowing React frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    try:
        init_db()
        print("PostgreSQL connection and users schema initialized successfully.")
    except Exception as e:
        print(f"Warning during DB init: {e}")

model_manager = AirGuardModelManager()

# Helper for unified response envelope
def api_response(data: Any, message: str = "Success"):
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# -------------------------------------------------------------
# 1. Health & Meta
# -------------------------------------------------------------
@app.get("/")
def root_endpoint(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AirGuard AI — Backend Service Online</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #030712;
      color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: radial-gradient(120% 120% at 50% 10%, #111827 0%, #030712 100%);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 24px;
      padding: 2.5rem;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 1.5rem;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #a7f3d0 50%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #9ca3af;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0.9rem 1.4rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.92rem;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #10b981, #06b6d4);
      color: #030712;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.4);
    }
    .btn-secondary {
      background: #1f2937;
      color: #e5e7eb;
      border: 1px solid #374151;
    }
    .btn-secondary:hover {
      background: #374151;
      color: #ffffff;
      transform: translateY(-2px);
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #1f2937;
      text-align: left;
    }
    .meta-item {
      font-size: 0.78rem;
    }
    .meta-label { color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.7rem; }
    .meta-val { color: #d1d5db; font-weight: 700; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      API Microservice Online &bull; Port 8000
    </div>
    <h1>AirGuard AI Backend</h1>
    <p>The Python FastAPI Environmental Intelligence & ML inference backend is fully operational. Open the React application to explore live telemetry and interactive AQI predictions.</p>
    
    <div class="btn-group">
      <a href="http://localhost:5173" class="btn btn-primary">
        &rarr; Launch Frontend Web App (Port 5173)
      </a>
      <a href="/docs" class="btn btn-secondary">
        &equiv; Open Interactive Swagger API Docs
      </a>
      <a href="/health" class="btn btn-secondary">
        &hearts; View System Health & Telemetry Status
      </a>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Champion ML Model</div>
        <div class="meta-val">Ridge Regression (R&sup2; 0.63)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Database Status</div>
        <div class="meta-val" style="color: #34d399;">PostgreSQL 16 Connected</div>
      </div>
    </div>
  </div>
</body>
</html>"""
        return HTMLResponse(content=html_content)

    return JSONResponse(content={
        "service": "AirGuard AI — Intelligent Air Quality Prediction & Advisory Platform",
        "status": "online",
        "version": "2.0.0",
        "health": "/health",
        "docs": "/docs",
        "frontend": "http://localhost:5173",
        "api": {
            "cities": "/api/cities",
            "telemetry": "/api/air-quality/current/Delhi",
            "predict": "/api/ml/predict",
            "model_performance": "/api/ml/model-performance",
            "auth": "/api/auth/me"
        },
        "default_model": model_manager.best_model_name,
        "available_models": list(model_manager.models.keys()),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AirGuard AI Unified Python Backend",
        "version": "2.0.0",
        "models": list(model_manager.models.keys()),
        "default_model": model_manager.best_model_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# -------------------------------------------------------------
# 2. Authentication Routes
# -------------------------------------------------------------
@app.post("/api/auth/register")
def register(req: RegisterRequest):
    result = register_user(req)
    return api_response(result, "Account registered successfully")

@app.post("/api/auth/login")
def login(req: LoginRequest):
    result = login_user(req)
    return api_response(result, "Login successful")

@app.get("/api/auth/me")
def get_me(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.replace("Bearer ", "").strip()
    session = get_user_from_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return api_response(session, "Current user session active")

# -------------------------------------------------------------
# 3. Cities & Geolocation Routes
# -------------------------------------------------------------
class LocateRequest(BaseModel):
    latitude: float
    longitude: float
    name: Optional[str] = None

class AddCityRequest(BaseModel):
    name: str
    state: Optional[str] = None
    country: str
    latitude: float
    longitude: float
    timezone: Optional[str] = "UTC"

@app.get("/api/cities")
def list_cities():
    cities = get_all_cities()
    return api_response(cities)

@app.get("/api/cities/search")
def search_cities(query: str = Query(..., min_length=2)):
    results = search_cities_external(query)
    return api_response(results)

@app.get("/api/cities/compare")
def compare(city1: Optional[str] = None, city2: Optional[str] = None, city3: Optional[str] = None):
    names = [c for c in [city1, city2, city3] if c and c.strip()]
    if not names:
        names = ["Delhi", "Mumbai"]
    comp = compare_cities(names)
    return api_response(comp)

@app.get("/api/cities/{name}")
def get_city(name: str):
    city = get_city_by_name(name)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return api_response(city)

@app.post("/api/cities/locate")
def locate_city(req: LocateRequest):
    city = locate_and_register(req.latitude, req.longitude, req.name)
    return api_response(city, "Location registered and telemetry ingested")

@app.post("/api/cities/add")
def add_city(req: AddCityRequest):
    city = add_custom_city(req.name, req.state, req.country, req.latitude, req.longitude, req.timezone)
    return api_response(city, "Custom city added and telemetry synced")

# -------------------------------------------------------------
# 4. Air Quality Telemetry Routes
# -------------------------------------------------------------
@app.get("/api/air-quality/current/{city}")
def current_air_quality(city: str):
    curr = get_current_air_quality(city)
    if not curr:
        raise HTTPException(status_code=404, detail=f"No telemetry found for {city}")
    return api_response(curr)

@app.get("/api/air-quality/history/{city}")
def history(city: str, hours: int = Query(default=72, ge=12, le=720)):
    records = get_historical_records(city, hours)
    return api_response(records)

@app.get("/api/air-quality/trends/{city}")
def trends(city: str):
    t = get_trends(city)
    return api_response(t)

@app.get("/api/air-quality/pollutants/{city}")
def pollutants(city: str):
    items = get_pollutant_breakdown(city)
    return api_response(items)

# -------------------------------------------------------------
# 5. Machine Learning Prediction Routes
# -------------------------------------------------------------
class PredictRequest(BaseModel):
    city: str = Field(default="Delhi")
    pm25: Optional[float] = Field(default=55.0)
    pm10: Optional[float] = Field(default=95.0)
    no2: Optional[float] = Field(default=30.0)
    so2: Optional[float] = Field(default=10.0)
    co: Optional[float] = Field(default=1.2)
    o3: Optional[float] = Field(default=35.0)
    temperature: Optional[float] = Field(default=26.0)
    humidity: Optional[float] = Field(default=60.0)
    wind_speed: Optional[float] = Field(default=7.5)
    windSpeed: Optional[float] = None
    recent_pm25_history: Optional[List[float]] = None
    recentPm25History: Optional[List[float]] = None
    model_name: Optional[str] = None
    modelName: Optional[str] = None

    def get_wind_speed(self) -> float:
        return self.windSpeed if self.windSpeed is not None else (self.wind_speed if self.wind_speed is not None else 7.5)

    def get_recent_history(self) -> Optional[List[float]]:
        return self.recentPm25History if self.recentPm25History is not None else self.recent_pm25_history

    def get_model_name(self) -> Optional[str]:
        return self.modelName if self.modelName is not None else self.model_name

@app.post("/api/ml/predict")
def predict_aqi(req: PredictRequest):
    try:
        result = model_manager.predict(
            city=req.city,
            pm25=req.pm25,
            pm10=req.pm10,
            no2=req.no2,
            so2=req.so2,
            co=req.co,
            o3=req.o3,
            temperature=req.temperature,
            humidity=req.humidity,
            wind_speed=req.get_wind_speed(),
            recent_pm25_history=req.get_recent_history(),
            model_name=req.get_model_name()
        )
        # Provide camelCase aliases for seamless frontend compatibility
        result["predictedAqi"] = result.get("predicted_aqi")
        result["aqiCategory"] = result.get("aqi_category")
        result["categoryColor"] = result.get("category_color")
        result["categoryDescription"] = result.get("category_description")
        result["predictionInterval"] = result.get("prediction_interval")
        result["modelName"] = result.get("model_name")
        result["modelVersion"] = result.get("model_version")
        result["contributingFactors"] = result.get("contributing_factors")
        result["predictionTime"] = datetime.now(timezone.utc).isoformat()
        return api_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction failure: {str(e)}")

@app.get("/api/ml/model-performance")
def model_performance():
    if not model_manager.metrics:
        model_manager.load_models()
    return api_response(model_manager.metrics)

@app.get("/api/predictions/history")
def prediction_history(limit: int = 20):
    return api_response([])

# -------------------------------------------------------------
# 6. Generative AI & Advisory Routes
# -------------------------------------------------------------
class AIAdvisoryRequest(BaseModel):
    city: str
    healthProfile: Optional[str] = "general"
    question: Optional[str] = None

class AIChatRequest(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    city: Optional[str] = None
    selectedCity: Optional[str] = None
    contextData: Optional[Dict[str, Any]] = None

    def get_message(self) -> str:
        return self.message or self.question or "What is the current air quality advisory?"

    def get_city(self) -> str:
        return self.city or self.selectedCity or "Delhi"

@app.post("/api/ai/advisory")
def advisory_endpoint(req: AIAdvisoryRequest):
    adv = generate_ai_advisory(req.city, req.healthProfile, req.question)
    return api_response(adv)

@app.post("/api/ai/explain")
def explain_endpoint(payload: Dict[str, Any]):
    city = payload.get("city", "Delhi")
    adv = generate_ai_advisory(city)
    return api_response(adv)

@app.post("/api/ai/chat")
def chat_endpoint(req: AIChatRequest):
    msg = req.get_message()
    city = req.get_city()
    res = generate_ai_chat_response(msg, city, req.contextData)
    return api_response(res)

# -------------------------------------------------------------
# 7. Favorites Routes
# -------------------------------------------------------------
class FavoriteRequest(BaseModel):
    cityName: str
    userId: Optional[str] = "default_user"

@app.get("/api/favorites")
def list_favorites(userId: str = "default_user"):
    favs = get_user_favorites(userId)
    return api_response(favs)

@app.post("/api/favorites")
def add_fav(req: FavoriteRequest):
    ok = add_user_favorite(req.cityName, req.userId)
    return api_response(ok)

@app.delete("/api/favorites/{cityName}")
def remove_fav(cityName: str, userId: str = "default_user"):
    ok = remove_user_favorite(cityName, userId)
    return api_response(ok)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=False)
