# AirGuard AI: System Architecture Document

## High-Level System Architecture

AirGuard AI is designed with an decoupled, service-oriented architecture balancing data science rigour with enterprise backend engineering.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|                   React 18 + Vite + Tailwind CSS + Recharts                       |
|               (Dashboard, ML Forecast, Pollutants, Compare, AI Advisor)           |
+------------------------------------------+----------------------------------------+
                                           |
                                           | REST / JSON (HTTP :8080)
                                           v
+-----------------------------------------------------------------------------------+
|                             SPRING BOOT BACKEND (:8080)                           |
|  - API Gateway & Request Orchestration                                            |
|  - Domain Security & Centralized Exception Handling                               |
|  - Spring Data JPA / Hibernate Persistence Layer                                  |
|  - Context-Grounded Generative AI Engine (Anti-Hallucination Prompting)           |
|  - Resilient Fallback Engine & Environmental Health Standards (US EPA Breakpoints)|
+-------------------+----------------------+--------------------+-------------------+
                    |                      |                    |
       JPA / JDBC   |        WebClient IPC |         HTTPS / REST
                    v                      v                    v
+-----------------------+ +--------------------+ +----------------------------------+
|   PostgreSQL 18 DB    | | FastAPI ML Service | | Open-Meteo & Copernicus CAMS API |
|   (:5432)             | | (:8000)            | | (Hourly ambient sensor feeds &   |
| - cities              | | - Best Model (Joblib| |  meteorological telemetry)       |
| - air_quality_records | | - Feature Eng.     | +----------------------------------+
| - predictions         | | - Factor Attribution|
| - model_metrics       | | - Pred. Intervals  |
| - favorites           | +--------------------+
| - ai_interactions     |
+-----------------------+
```

---

## Component Breakdown

### 1. React Presentation Layer (`frontend/`)
- **Technology**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Axios.
- **Responsibilities**:
  - Real-time station telemetry visualization (circular animated SVG gauge, interactive multi-axis area & bar charts).
  - Horizon-based forecast explorer with prediction intervals and feature attribution.
  - Contextual "Ask AirGuard" conversational chat interface with medical disclaimer guards.
  - Multi-city comparison matrix with side-by-side grouped visualizations.

### 2. Spring Boot Core Service (`backend/`)
- **Technology**: Java 17/23, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring WebFlux (`WebClient`).
- **Key Patterns**:
  - **Controller-Service-Repository**: Clean separation of web exposure, business logic, and transactional persistence.
  - **Client Gateway**: Reactive WebClient calling downstream Python FastAPI microservice with circuit-breaker fallbacks.
  - **Context-Grounded Prompting**: Injects exact database metrics into AI prompts to eliminate statistical hallucination.
  - **Unified API Response**: `ApiResponse<T>` envelope standardizing all HTTP responses.

### 3. Machine Learning Microservice (`ml-service/`)
- **Technology**: Python 3.13, FastAPI, Uvicorn, Scikit-learn, Pandas, NumPy, Joblib.
- **Responsibilities**:
  - Feature engineering pipeline (cyclical hour sine/cosine, 1h/24h backward lags, 6h/24h rolling means).
  - Out-of-sample prediction and statistical prediction intervals ($\pm 1.96 \times \text{RMSE}$).
  - Feature importance extraction for explainable AI.
  - Multi-model evaluation benchmark (Ridge Baseline vs Random Forest vs Gradient Boosting).

### 4. Relational Database Layer (`PostgreSQL 18`)
- **Database**: `airguard_db`
- **Optimization**:
  - Composite indexes: `idx_aq_city_timestamp` on `(city_id, timestamp DESC)`.
  - Partitioning ready: chronological ordering by timestamp.
  - Strict foreign keys with cascading deletions.
