import os
import sys
import time
from datetime import datetime, timezone
import requests
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456789")
DB_NAME = os.getenv("DB_NAME", "airguard_db")

CITIES = [
    {
        "name": "Delhi",
        "state": "Delhi",
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone": "Asia/Kolkata"
    },
    {
        "name": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "timezone": "Asia/Kolkata"
    },
    {
        "name": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timezone": "Asia/Kolkata"
    },
    {
        "name": "London",
        "state": "Greater London",
        "country": "United Kingdom",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "timezone": "Europe/London"
    },
    {
        "name": "New York",
        "state": "New York",
        "country": "United States",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "timezone": "America/New_York"
    }
]

# US EPA AQI Breakpoints for PM2.5 (ug/m3)
# (C_low, C_high, I_low, I_high)
PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 500.4, 301, 500)
]

# US EPA AQI Breakpoints for PM10 (ug/m3)
PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500)
]

# US EPA AQI Breakpoints for Ozone (ug/m3 ~ ppb converted)
O3_BREAKPOINTS = [
    (0, 105, 0, 50),
    (106, 140, 51, 100),
    (141, 170, 101, 150),
    (171, 210, 151, 200),
    (211, 400, 201, 300),
    (401, 800, 301, 500)
]

# US EPA AQI Breakpoints for NO2 (ug/m3)
NO2_BREAKPOINTS = [
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 2049, 301, 500)
]

def calculate_sub_index(conc, breakpoints):
    if conc is None or np.isnan(conc) or conc < 0:
        return 0
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= conc <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low)
    # If conc exceeds highest breakpoint
    if conc > breakpoints[-1][1]:
        c_low, c_high, i_low, i_high = breakpoints[-1]
        return min(500, round(((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low))
    return 0

def get_aqi_category(aqi):
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def compute_record_aqi(row):
    sub_indices = {
        "PM2.5": calculate_sub_index(row.get("pm25"), PM25_BREAKPOINTS),
        "PM10": calculate_sub_index(row.get("pm10"), PM10_BREAKPOINTS),
        "O3": calculate_sub_index(row.get("o3"), O3_BREAKPOINTS),
        "NO2": calculate_sub_index(row.get("no2"), NO2_BREAKPOINTS)
    }
    # Max sub-index defines AQI
    max_pollutant, max_aqi = max(sub_indices.items(), key=lambda x: x[1])
    
    # If Open-Meteo provided a us_aqi that is valid, compare and reconcile
    api_aqi = row.get("us_aqi")
    if api_aqi is not None and not np.isnan(api_aqi) and api_aqi > 0:
        final_aqi = int(max(max_aqi, api_aqi))
    else:
        final_aqi = int(max_aqi)
        
    final_aqi = max(5, min(500, final_aqi))
    return final_aqi, get_aqi_category(final_aqi), max_pollutant

def fetch_air_quality_data(lat, lon, past_days=90):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ["pm2_5", "pm10", "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide", "ozone", "us_aqi"],
        "past_days": past_days,
        "forecast_days": 2
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json().get("hourly", {})
    df = pd.DataFrame(data)
    df.rename(columns={
        "pm2_5": "pm25",
        "nitrogen_dioxide": "no2",
        "sulphur_dioxide": "so2",
        "carbon_monoxide": "co",
        "ozone": "o3"
    }, inplace=True)
    return df

def fetch_weather_data(lat, lon, past_days=90):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"],
        "past_days": past_days,
        "forecast_days": 2
    }
    resp = requests.get(url, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json().get("hourly", {})
    df = pd.DataFrame(data)
    df.rename(columns={
        "temperature_2m": "temperature",
        "relative_humidity_2m": "humidity",
        "wind_speed_10m": "wind_speed"
    }, inplace=True)
    return df

def ingest_all_cities():
    print("==================================================")
    print("  AirGuard AI: Real Historical Data Ingestion")
    print("==================================================")

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor()

    all_cleaned_dfs = []

    for city_info in CITIES:
        name = city_info["name"]
        print(f"\n[+] Processing city: {name} ({city_info['country']})")

        # 1. Upsert City into Database
        cursor.execute("""
            INSERT INTO cities (name, state, country, latitude, longitude, timezone)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (name) DO UPDATE 
            SET state = EXCLUDED.state,
                country = EXCLUDED.country,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                timezone = EXCLUDED.timezone
            RETURNING id;
        """, (name, city_info["state"], city_info["country"], city_info["latitude"], city_info["longitude"], city_info["timezone"]))
        city_id = cursor.fetchone()[0]
        conn.commit()
        print(f"    City ID in PostgreSQL: {city_id}")

        # 2. Fetch Real Atmospheric Data
        try:
            print("    Fetching atmospheric pollutant records (past 90 days + 48h forecast)...")
            aq_df = fetch_air_quality_data(city_info["latitude"], city_info["longitude"], past_days=90)
            time.sleep(0.5) # respectful delay

            print("    Fetching co-located meteorological records...")
            wx_df = fetch_weather_data(city_info["latitude"], city_info["longitude"], past_days=90)
            time.sleep(0.5)

            # Merge on timestamp
            merged_df = pd.merge(aq_df, wx_df, on="time", how="inner")
            print(f"    Fetched {len(merged_df)} hourly observations.")

            # 3. Clean & Impute Missing Data
            merged_df["time"] = pd.to_datetime(merged_df["time"])
            
            # Sort chronologically
            merged_df = merged_df.sort_values("time").reset_index(drop=True)

            # Missing value handling: forward-fill then backward-fill
            cols_to_fill = ["pm25", "pm10", "no2", "so2", "co", "o3", "temperature", "humidity", "wind_speed"]
            for col in cols_to_fill:
                if col in merged_df.columns:
                    # Realistic physical clamping
                    merged_df[col] = merged_df[col].interpolate(method="linear").bfill().ffill()
                    if col in ["pm25", "pm10"]:
                        merged_df[col] = merged_df[col].clip(lower=0.5, upper=1200.0)
                    elif col in ["no2", "so2", "o3"]:
                        merged_df[col] = merged_df[col].clip(lower=0.1, upper=1500.0)
                    elif col == "co":
                        merged_df[col] = merged_df[col].clip(lower=0.01, upper=20000.0)

            # 4. Compute standard AQI & Category
            aqi_results = [compute_record_aqi(row) for _, row in merged_df.iterrows()]
            merged_df["calculated_aqi"] = [r[0] for r in aqi_results]
            merged_df["calculated_category"] = [r[1] for r in aqi_results]
            merged_df["primary_pollutant"] = [r[2] for r in aqi_results]

            # 5. Insert into Database in batches
            records_to_insert = []
            for _, row in merged_df.iterrows():
                ts_iso = row["time"].isoformat()
                records_to_insert.append((
                    city_id,
                    ts_iso,
                    float(row["pm25"]),
                    float(row["pm10"]),
                    float(row["no2"]),
                    float(row["so2"]),
                    float(row["co"]),
                    float(row["o3"]),
                    float(row["temperature"]),
                    float(row["humidity"]),
                    float(row["wind_speed"]),
                    int(row["calculated_aqi"]),
                    row["calculated_category"],
                    row["primary_pollutant"],
                    "Open-Meteo / Copernicus CAMS"
                ))

            insert_query = """
                INSERT INTO air_quality_records (
                    city_id, timestamp, pm25, pm10, no2, so2, co, o3,
                    temperature, humidity, wind_speed, aqi, aqi_category,
                    primary_pollutant, data_source
                ) VALUES %s
                ON CONFLICT (city_id, timestamp) DO UPDATE
                SET pm25 = EXCLUDED.pm25,
                    pm10 = EXCLUDED.pm10,
                    no2 = EXCLUDED.no2,
                    so2 = EXCLUDED.so2,
                    co = EXCLUDED.co,
                    o3 = EXCLUDED.o3,
                    temperature = EXCLUDED.temperature,
                    humidity = EXCLUDED.humidity,
                    wind_speed = EXCLUDED.wind_speed,
                    aqi = EXCLUDED.aqi,
                    aqi_category = EXCLUDED.aqi_category,
                    primary_pollutant = EXCLUDED.primary_pollutant;
            """
            execute_values(cursor, insert_query, records_to_insert)
            conn.commit()
            print(f"    Successfully persisted {len(records_to_insert)} records to PostgreSQL.")

            # Store for master CSV export
            merged_df["city_name"] = name
            merged_df["city_id"] = city_id
            all_cleaned_dfs.append(merged_df)

        except Exception as e:
            print(f"    [!] Error processing {name}: {e}")
            conn.rollback()

    cursor.close()
    conn.close()

    # 6. Save Consolidated CSV for ML Training and Notebook
    if all_cleaned_dfs:
        master_df = pd.concat(all_cleaned_dfs, ignore_index=True)
        os.makedirs("data/raw", exist_ok=True)
        os.makedirs("ml-service/data", exist_ok=True)

        master_path = "data/air_quality_master.csv"
        ml_path = "ml-service/data/air_quality_cleaned.csv"
        master_df.to_csv(master_path, index=False)
        master_df.to_csv(ml_path, index=False)
        print(f"\n[DONE] Ingestion Complete!")
        print(f"    Master dataset saved to: {master_path}")
        print(f"    ML training dataset saved to: {ml_path}")
        print(f"    Total rows across all cities: {len(master_df):,}")

if __name__ == "__main__":
    ingest_all_cities()
