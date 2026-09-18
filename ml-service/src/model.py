import os
import json
import joblib
import numpy as np
import pandas as pd
from src.aqi_standard import get_aqi_details
from src.feature_engineering import FEATURE_COLUMNS, build_inference_feature_vector

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
DEFAULT_MODEL_NAME = "GradientBoostingRegressor"

class AirGuardModelManager:
    def __init__(self):
        self.models = {}
        self.metrics = {}
        self.best_model_name = DEFAULT_MODEL_NAME
        self.load_models()

    def load_models(self):
        metrics_file = os.path.join(MODELS_DIR, "metrics.json")
        if os.path.exists(metrics_file):
            try:
                with open(metrics_file, "r") as f:
                    self.metrics = json.load(f)
                    self.best_model_name = self.metrics.get("best_model", DEFAULT_MODEL_NAME)
            except Exception as e:
                print(f"[!] Warning: Could not read metrics.json: {e}")

        for model_file in ["aqi_model_gb.joblib", "aqi_model_rf.joblib", "baseline_lr.joblib"]:
            path = os.path.join(MODELS_DIR, model_file)
            if os.path.exists(path):
                try:
                    loaded = joblib.load(path)
                    name = loaded.get("name", model_file.replace(".joblib", ""))
                    self.models[name] = loaded
                    print(f"[*] Loaded model: {name} from {model_file}")
                except Exception as e:
                    print(f"[!] Error loading {model_file}: {e}")

    def predict(
        self,
        city: str,
        pm25: float, pm10: float, no2: float, so2: float, co: float, o3: float,
        temperature: float, humidity: float, wind_speed: float,
        recent_pm25_history: list = None,
        model_name: str = None
    ) -> dict:
        target_name = model_name or self.best_model_name
        model_payload = self.models.get(target_name)
        
        # If requested model not found, fallback to any loaded model
        if not model_payload and self.models:
            target_name = list(self.models.keys())[0]
            model_payload = self.models[target_name]

        if not model_payload:
            # Domain-based fallback estimate if models not trained yet
            base_val = max(10.0, pm25 * 1.55 + pm10 * 0.35 + no2 * 0.2 - wind_speed * 1.2)
            predicted_aqi = round(base_val, 1)
            aqi_info = get_aqi_details(predicted_aqi)
            return {
                "city": city,
                "predicted_aqi": predicted_aqi,
                "aqi_category": aqi_info["category"],
                "category_color": aqi_info["color"],
                "prediction_interval": [max(0, round(predicted_aqi - 15, 1)), round(predicted_aqi + 15, 1)],
                "model_name": "FallbackDomainEstimator",
                "model_version": "1.0-fallback",
                "contributing_factors": [
                    {"feature": "PM2.5", "importance": 48.5, "description": "Particulate matter <= 2.5um"},
                    {"feature": "PM10", "importance": 24.2, "description": "Particulate matter <= 10um"},
                    {"feature": "Wind Speed", "importance": 14.3, "description": "Dispersion wind velocity"},
                    {"feature": "NO2", "importance": 8.0, "description": "Nitrogen Dioxide"},
                    {"feature": "O3", "importance": 5.0, "description": "Ground-level Ozone"}
                ]
            }

        estimator = model_payload["model"]
        scaler = model_payload.get("scaler")
        rmse = model_payload.get("rmse", 14.5)
        feature_importances = model_payload.get("feature_importances", {})

        # Build feature vector
        X_df = build_inference_feature_vector(
            pm25, pm10, no2, so2, co, o3,
            temperature, humidity, wind_speed,
            recent_pm25_history=recent_pm25_history
        )

        if scaler:
            X_input = scaler.transform(X_df)
        else:
            X_input = X_df

        raw_pred = estimator.predict(X_input)[0]
        # Realistic bounds
        predicted_aqi = round(float(np.clip(raw_pred, 5.0, 500.0)), 1)
        aqi_info = get_aqi_details(predicted_aqi)

        # 95% prediction interval (approx +/- 1.96 * RMSE of model on test data)
        margin = round(1.96 * rmse, 1)
        interval_min = max(0.0, round(predicted_aqi - margin, 1))
        interval_max = min(500.0, round(predicted_aqi + margin, 1))

        # Format factor rankings
        human_names = {
            "pm25": "PM2.5",
            "pm10": "PM10",
            "no2": "NO2",
            "so2": "SO2",
            "co": "CO",
            "o3": "Ozone (O3)",
            "temperature": "Temperature",
            "humidity": "Humidity",
            "wind_speed": "Wind Speed",
            "pm25_lag1": "PM2.5 (1h Lag)",
            "pm25_lag24": "PM2.5 (24h Lag)",
            "pm10_lag1": "PM10 (1h Lag)",
            "pm25_roll_mean_6h": "PM2.5 (6h Avg)",
            "pm25_roll_mean_24h": "PM2.5 (24h Trend)",
            "aqi_roll_mean_24h": "AQI 24h Baseline",
            "wind_roll_mean_6h": "Wind 6h Avg",
            "hour_sin": "Diurnal Cycle",
            "hour_cos": "Diurnal Phase",
            "day_of_week": "Weekly Cycle",
            "month": "Seasonal Cycle",
            "is_weekend": "Weekend Factor"
        }

        contributing_factors = []
        for feat, score in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]:
            contributing_factors.append({
                "feature": human_names.get(feat, feat),
                "importance": round(float(score * 100), 1),
                "raw_key": feat
            })

        return {
            "city": city,
            "predicted_aqi": predicted_aqi,
            "aqi_category": aqi_info["category"],
            "category_color": aqi_info["color"],
            "category_description": aqi_info["description"],
            "prediction_interval": [interval_min, interval_max],
            "model_name": target_name,
            "model_version": model_payload.get("version", "1.0.0"),
            "contributing_factors": contributing_factors
        }
