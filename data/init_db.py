import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456789")
DB_NAME = os.getenv("DB_NAME", "airguard_db")

def init_database():
    print(f"Connecting to PostgreSQL on {DB_HOST}:{DB_PORT} as {DB_USER}...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
    exists = cursor.fetchone()
    if not exists:
        print(f"Database '{DB_NAME}' does not exist. Creating...")
        cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"Database '{DB_NAME}' created successfully.")
    else:
        print(f"Database '{DB_NAME}' already exists.")

    cursor.close()
    conn.close()

    # Connect to target database and create tables
    print(f"Connecting to '{DB_NAME}' to apply schema...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor()

    schema_sql = """
    CREATE TABLE IF NOT EXISTS cities (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        state VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_city_timestamp UNIQUE (city_id, timestamp)
    );

    CREATE INDEX IF NOT EXISTS idx_aq_city_timestamp ON air_quality_records(city_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_aq_timestamp ON air_quality_records(timestamp);

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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_pred_city_time ON predictions(city_id, prediction_time DESC);

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
        trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
        id BIGSERIAL PRIMARY KEY,
        city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        user_identifier VARCHAR(100) DEFAULT 'default_user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_city UNIQUE (user_identifier, city_id)
    );

    CREATE TABLE IF NOT EXISTS ai_interactions (
        id BIGSERIAL PRIMARY KEY,
        city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL,
        interaction_type VARCHAR(50) NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        context_data TEXT,
        model_used VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """

    cursor.execute(schema_sql)
    conn.commit()
    print("Schema executed and verified successfully!")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    init_database()
