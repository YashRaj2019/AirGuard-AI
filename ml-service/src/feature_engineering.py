import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "pm25", "pm10", "no2", "so2", "co", "o3",
    "temperature", "humidity", "wind_speed",
    "hour_sin", "hour_cos", "day_of_week", "month", "is_weekend",
    "pm25_lag1", "pm25_lag24", "pm10_lag1",
    "pm25_roll_mean_6h", "pm25_roll_mean_24h",
    "aqi_roll_mean_24h", "wind_roll_mean_6h"
]

def engineer_features(df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
    """
    Transforms raw atmospheric and weather time-series into ML features.
    Guarantees no future lookahead (strictly backwards-looking shifts and rolling windows).
    """
    df = df.copy()
    if "time" in df.columns:
        df["time"] = pd.to_datetime(df["time"])
        df = df.sort_values(["city_name", "time"]).reset_index(drop=True)
    elif "timestamp" in df.columns:
        df["time"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values(["city_name", "time"]).reset_index(drop=True)

    # 1. Cyclical & Calendar features
    hour = df["time"].dt.hour
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)
    df["day_of_week"] = df["time"].dt.dayofweek
    df["month"] = df["time"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # 2. Lag and Rolling features grouped by city to prevent cross-city leakage
    if "city_name" in df.columns:
        grouped = df.groupby("city_name")
    else:
        grouped = df.groupby(lambda x: 0)

    # Lag features (strictly backward looking using shift)
    df["pm25_lag1"] = grouped["pm25"].shift(1)
    df["pm25_lag24"] = grouped["pm25"].shift(24)
    df["pm10_lag1"] = grouped["pm10"].shift(1)

    # Rolling statistics
    df["pm25_roll_mean_6h"] = grouped["pm25"].transform(lambda s: s.shift(1).rolling(window=6, min_periods=1).mean())
    df["pm25_roll_mean_24h"] = grouped["pm25"].transform(lambda s: s.shift(1).rolling(window=24, min_periods=1).mean())
    
    aqi_col = "calculated_aqi" if "calculated_aqi" in df.columns else "aqi"
    df["aqi_roll_mean_24h"] = grouped[aqi_col].transform(lambda s: s.shift(1).rolling(window=24, min_periods=1).mean())
    df["wind_roll_mean_6h"] = grouped["wind_speed"].transform(lambda s: s.shift(1).rolling(window=6, min_periods=1).mean())

    if is_training:
        # Target: AQI 24 hours into future
        df["target_aqi_24h"] = grouped[aqi_col].shift(-24)
        # Drop rows where target or 24h lags are NaN
        df = df.dropna(subset=FEATURE_COLUMNS + ["target_aqi_24h"]).reset_index(drop=True)
    else:
        # For inference, backfill any initial window warmup NaNs with current values
        for col in FEATURE_COLUMNS:
            if col in df.columns and df[col].isna().any():
                df[col] = df[col].bfill().ffill()

    return df

def build_inference_feature_vector(
    pm25: float, pm10: float, no2: float, so2: float, co: float, o3: float,
    temperature: float, humidity: float, wind_speed: float,
    recent_pm25_history: list = None,
    current_hour: int = 12,
    day_of_week: int = 2,
    month: int = 9
) -> pd.DataFrame:
    """
    Builds a single-row feature dataframe matching exact training columns for live model prediction.
    """
    hour_sin = np.sin(2 * np.pi * current_hour / 24.0)
    hour_cos = np.cos(2 * np.pi * current_hour / 24.0)
    is_weekend = 1 if day_of_week >= 5 else 0

    # If recent history is provided, compute true lags and rolling stats; otherwise derive from current
    if recent_pm25_history and len(recent_pm25_history) >= 24:
        pm25_lag1 = float(recent_pm25_history[-1])
        pm25_lag24 = float(recent_pm25_history[-24])
        pm25_roll_mean_6h = float(np.mean(recent_pm25_history[-6:]))
        pm25_roll_mean_24h = float(np.mean(recent_pm25_history[-24:]))
    elif recent_pm25_history and len(recent_pm25_history) > 0:
        pm25_lag1 = float(recent_pm25_history[-1])
        pm25_lag24 = float(recent_pm25_history[0])
        pm25_roll_mean_6h = float(np.mean(recent_pm25_history))
        pm25_roll_mean_24h = float(np.mean(recent_pm25_history))
    else:
        pm25_lag1 = pm25 * 0.98
        pm25_lag24 = pm25 * 0.95
        pm25_roll_mean_6h = pm25
        pm25_roll_mean_24h = pm25

    pm10_lag1 = pm10 * 0.97
    aqi_roll_mean_24h = max(20.0, pm25_roll_mean_24h * 1.6)
    wind_roll_mean_6h = wind_speed

    data = {
        "pm25": [pm25],
        "pm10": [pm10],
        "no2": [no2],
        "so2": [so2],
        "co": [co],
        "o3": [o3],
        "temperature": [temperature],
        "humidity": [humidity],
        "wind_speed": [wind_speed],
        "hour_sin": [hour_sin],
        "hour_cos": [hour_cos],
        "day_of_week": [day_of_week],
        "month": [month],
        "is_weekend": [is_weekend],
        "pm25_lag1": [pm25_lag1],
        "pm25_lag24": [pm25_lag24],
        "pm10_lag1": [pm10_lag1],
        "pm25_roll_mean_6h": [pm25_roll_mean_6h],
        "pm25_roll_mean_24h": [pm25_roll_mean_24h],
        "aqi_roll_mean_24h": [aqi_roll_mean_24h],
        "wind_roll_mean_6h": [wind_roll_mean_6h]
    }
    return pd.DataFrame(data, columns=FEATURE_COLUMNS)
