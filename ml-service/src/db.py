import os
import hashlib
import secrets
from datetime import datetime, timezone
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456789")
DB_NAME = os.getenv("DB_NAME", "airguard_db")

# Connection pool
pg_pool = None

def get_pool():
    global pg_pool
    if pg_pool is None:
        if DATABASE_URL:
            # Handle standard postgres:// and postgresql:// URL prefixes
            dsn = DATABASE_URL
            if dsn.startswith("postgres://"):
                dsn = dsn.replace("postgres://", "postgresql://", 1)
            pg_pool = psycopg2.pool.SimpleConnectionPool(
                minconn=1,
                maxconn=15,
                dsn=dsn
            )
        else:
            pg_pool = psycopg2.pool.SimpleConnectionPool(
                minconn=1,
                maxconn=15,
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                dbname=DB_NAME
            )
    return pg_pool

def get_db_connection():
    return get_pool().getconn()

def release_db_connection(conn):
    if pg_pool and conn:
        pg_pool.putconn(conn)

def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, _ = stored_hash.split(":", 1)
        return hash_password(password, salt) == stored_hash
    except Exception:
        return False

def init_db():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Cities table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cities (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    state VARCHAR(100),
                    country VARCHAR(100) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # 2. Seed initial 10 global cities if empty
            cur.execute("SELECT COUNT(*) FROM cities;")
            count = cur.fetchone()[0]
            if count == 0:
                cur.execute("""
                    INSERT INTO cities (name, state, country, latitude, longitude, timezone) VALUES
                    ('Delhi', 'Delhi', 'India', 28.6139, 77.2090, 'Asia/Kolkata'),
                    ('Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777, 'Asia/Kolkata'),
                    ('Bengaluru', 'Karnataka', 'India', 12.9716, 77.5946, 'Asia/Kolkata'),
                    ('London', 'England', 'United Kingdom', 51.5074, -0.1278, 'Europe/London'),
                    ('New York', 'New York', 'United States', 40.7128, -74.0060, 'America/New_York'),
                    ('Pune', 'Maharashtra', 'India', 18.5204, 73.8567, 'Asia/Kolkata'),
                    ('Patna', 'Bihar', 'India', 25.5941, 85.1376, 'Asia/Kolkata'),
                    ('Paris', 'Île-de-France', 'France', 48.8566, 2.3522, 'Europe/Paris'),
                    ('Phagwara', 'Punjab', 'India', 31.2240, 75.7708, 'Asia/Kolkata'),
                    ('Adelaide', 'South Australia', 'Australia', -34.9285, 138.6007, 'Australia/Adelaide')
                    ON CONFLICT (name) DO NOTHING;
                """)

            # 3. Air quality records table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS air_quality_records (
                    id BIGSERIAL PRIMARY KEY,
                    city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    pm25 DOUBLE PRECISION,
                    pm10 DOUBLE PRECISION,
                    no2 DOUBLE PRECISION,
                    so2 DOUBLE PRECISION,
                    co DOUBLE PRECISION,
                    o3 DOUBLE PRECISION,
                    temperature DOUBLE PRECISION,
                    humidity DOUBLE PRECISION,
                    wind_speed DOUBLE PRECISION,
                    aqi INT NOT NULL,
                    aqi_category VARCHAR(50) NOT NULL,
                    primary_pollutant VARCHAR(20),
                    data_source VARCHAR(50) DEFAULT 'Open-Meteo / Copernicus CAMS',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    CONSTRAINT uq_city_timestamp UNIQUE (city_id, timestamp)
                );
            """)

            # 4. Predictions table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id BIGSERIAL PRIMARY KEY,
                    city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
                    prediction_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    predicted_aqi DOUBLE PRECISION NOT NULL,
                    aqi_category VARCHAR(50) NOT NULL,
                    interval_min DOUBLE PRECISION,
                    interval_max DOUBLE PRECISION,
                    primary_contributor VARCHAR(50),
                    model_name VARCHAR(100) NOT NULL,
                    model_version VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # 5. Model metrics table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS model_metrics (
                    id BIGSERIAL PRIMARY KEY,
                    model_name VARCHAR(100) NOT NULL,
                    model_type VARCHAR(50) NOT NULL,
                    mae DOUBLE PRECISION NOT NULL,
                    rmse DOUBLE PRECISION NOT NULL,
                    r2 DOUBLE PRECISION NOT NULL,
                    train_samples INT NOT NULL,
                    test_samples INT NOT NULL,
                    features_json TEXT,
                    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # 6. Users table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'ROLE_USER',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # 7. Favorites table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    city_id BIGINT REFERENCES cities(id) ON DELETE CASCADE,
                    user_identifier VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(city_id, user_identifier)
                );
            """)

            # 8. AI interactions table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ai_interactions (
                    id BIGSERIAL PRIMARY KEY,
                    city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL,
                    interaction_type VARCHAR(50) NOT NULL,
                    prompt TEXT NOT NULL,
                    response TEXT NOT NULL,
                    context_data TEXT,
                    model_used VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # 9. Seed demo user if not exists
            demo_email = "demo@airguard.ai"
            cur.execute("SELECT id FROM users WHERE email = %s;", (demo_email,))
            if not cur.fetchone():
                demo_hash = hash_password("airguard123")
                cur.execute("""
                    INSERT INTO users (name, email, password_hash, role, created_at)
                    VALUES (%s, %s, %s, %s, NOW());
                """, ("Placement Demo User", demo_email, demo_hash, "ROLE_ADMIN"))

            conn.commit()
    finally:
        release_db_connection(conn)

