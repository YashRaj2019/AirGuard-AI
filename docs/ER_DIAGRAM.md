# AirGuard AI: Entity-Relationship (ER) Documentation

## Database Schema Diagram

```mermaid
erDiagram
    CITIES ||--o{ AIR_QUALITY_RECORDS : "tracks hourly"
    CITIES ||--o{ PREDICTIONS : "generates forecast"
    CITIES ||--o{ FAVORITES : "saved by user"
    CITIES ||--o{ AI_INTERACTIONS : "context for"

    CITIES {
        bigserial id PK
        varchar(100) name UK
        varchar(100) state
        varchar(100) country
        double_precision latitude
        double_precision longitude
        varchar(50) timezone
        timestamp created_at
    }

    AIR_QUALITY_RECORDS {
        bigserial id PK
        bigint city_id FK
        timestamp timestamp
        double_precision pm25
        double_precision pm10
        double_precision no2
        double_precision so2
        double_precision co
        double_precision o3
        double_precision temperature
        double_precision humidity
        double_precision wind_speed
        int aqi
        varchar(50) aqi_category
        varchar(20) primary_pollutant
        varchar(50) data_source
        timestamp created_at
    }

    PREDICTIONS {
        bigserial id PK
        bigint city_id FK
        timestamp prediction_time
        double_precision predicted_aqi
        varchar(50) aqi_category
        double_precision interval_min
        double_precision interval_max
        varchar(50) primary_contributor
        varchar(100) model_name
        varchar(50) model_version
        timestamp created_at
    }

    MODEL_METRICS {
        bigserial id PK
        varchar(100) model_name
        varchar(50) model_type
        double_precision mae
        double_precision rmse
        double_precision r2
        int train_samples
        int test_samples
        text features_json
        timestamp trained_at
    }

    FAVORITES {
        bigserial id PK
        bigint city_id FK
        varchar(100) user_identifier
        timestamp created_at
    }

    AI_INTERACTIONS {
        bigserial id PK
        bigint city_id FK
        varchar(50) interaction_type
        text prompt
        text response
        text context_data
        varchar(100) model_used
        timestamp created_at
    }
```

---

## Indexing & Performance Design Decisions

1. **`idx_aq_city_timestamp` on `air_quality_records(city_id, timestamp DESC)`**:
   - **Rationale**: Most frequent analytical queries filter by a specific city and require recent time slices (e.g. `WHERE city_id = ? ORDER BY timestamp DESC LIMIT 72`). This composite B-tree index avoids full table scans and serves index-only scans for chronological sorting.
   - **Cardinality**: `city_id` provides initial partition pruning; `timestamp DESC` enables logarithmic seek to latest sensor events.

2. **`uq_city_timestamp` UNIQUE constraint on `(city_id, timestamp)`**:
   - **Rationale**: Enforces data idempotency during batch ingestion (`ON CONFLICT (city_id, timestamp) DO UPDATE`). Guarantees no duplicate telemetry rows exist for identical observation hours.

3. **`idx_pred_city_time` on `predictions(city_id, prediction_time DESC)`**:
   - **Rationale**: Accelerates forecast audit retrieval and enables fast lookup of future expected AQI horizons.
