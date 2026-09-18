# AirGuard AI: REST API Reference

Base URL: `http://localhost:8080/api`

---

## 1. City Endpoints

### `GET /api/cities`
Returns all registered air monitoring stations.

**Sample Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "name": "Delhi",
      "state": "Delhi",
      "country": "India",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "timezone": "Asia/Kolkata"
    }
  ],
  "timestamp": "2026-09-18T10:15:00Z"
}
```

### `GET /api/cities/compare?city1=Delhi&city2=London`
Compares ambient air conditions across multiple cities.

---

## 2. Air Quality Telemetry Endpoints

### `GET /api/air-quality/current/{city}`
Fetches real-time ambient concentrations, AQI, and 24h preview.

**Sample Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "cityName": "Delhi",
    "country": "India",
    "aqi": 169,
    "aqiCategory": "Unhealthy",
    "categoryColor": "#EF4444",
    "primaryPollutant": "PM2.5",
    "pm25": 90.1,
    "pm10": 160.4,
    "no2": 42.0,
    "so2": 14.2,
    "co": 1.9,
    "o3": 38.0,
    "temperature": 27.5,
    "humidity": 62.0,
    "windSpeed": 0.2,
    "predictedAqi": 182.9,
    "trend": "increasing"
  }
}
```

### `GET /api/air-quality/history/{city}?hours=72`
Returns sequential chronological observations for line charts.

### `GET /api/air-quality/trends/{city}`
Returns 14-day aggregated daily averages and 24h/7d/30d moving baselines.

### `GET /api/air-quality/pollutants/{city}`
Returns drill-down health benchmarks, safe reference limits, and sub-indices for all 6 criteria pollutants.

---

## 3. Machine Learning & Forecasting Endpoints

### `POST /api/ml/predict`
Invokes the Python ML microservice, computes statistical prediction intervals, extracts factor importance weights, synthesizes an AI explanation, and persists the prediction to PostgreSQL.

**Request Body**:
```json
{
  "city": "Delhi",
  "modelName": "Baseline (Ridge Regression)"
}
```

**Sample Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Prediction generated successfully",
  "data": {
    "city": "Delhi",
    "predictedAqi": 182.9,
    "aqiCategory": "Unhealthy",
    "categoryColor": "#EF4444",
    "predictionInterval": [166.4, 199.4],
    "modelName": "Baseline (Ridge Regression)",
    "modelVersion": "1.2.0",
    "contributingFactors": [
      { "feature": "PM2.5 (24h Trend)", "importance": 45.0, "rawKey": "pm25_roll_mean_24h" },
      { "feature": "PM10", "importance": 22.8, "rawKey": "pm10" }
    ],
    "aiExplanation": "Based on recent sensor measurements and historical patterns, the model forecasts that the Air Quality Index will increase..."
  }
}
```

### `GET /api/ml/model-performance`
Returns benchmark evaluation metrics (MAE, RMSE, R²) comparing all evaluated models.

---

## 4. Generative AI & Advisory Endpoints

### `POST /api/ai/chat`
Answers conversational questions grounded into real-time database context.

**Request Body**:
```json
{
  "question": "Why is today's AQI high?",
  "selectedCity": "Delhi"
}
```

### `POST /api/ai/advisory`
Generates actionable environmental precautions tailored to specific user demographics.
