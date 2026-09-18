# AirGuard AI: Placement & Technical Interview Defense Guide

This document prepares you for technical placement interviews (Software Engineering, Data Science, and Machine Learning) based directly on the architectural and statistical design of **AirGuard AI**.

---

### 1. Why is Machine Learning needed for AQI prediction?
*Atmospheric pollution is not a static linear sum of emissions; it is governed by complex fluid dynamics, diurnal photochemical reactions (solar radiation converting NOx and VOCs into ground ozone), and boundary layer meteorology (wind dispersion and thermal inversions). Traditional rule-based formulas cannot adapt to regional multi-lag dynamics across changing seasons. Machine learning captures non-linear interactions across atmospheric criteria pollutants and meteorological features to forecast air quality before severe episodes occur.*

---

### 2. Why is AQI prediction framed as a Regression problem rather than Classification?
*AQI is intrinsically continuous, ranging from 0 to 500+ with fine quantitative gradations. Formulating the task as regression offers three distinct advantages:*
1. *Preserves ordinal magnitude: Predicting 151 (Unhealthy) when the true value is 149 (Moderate) incurs minimal loss ($MAE=2$), whereas classification penalizes it as a complete categorical misclassification.*
2. *Enables statistical prediction intervals: We can compute continuous confidence bounds ($\pm 1.96 \times \text{RMSE}$) to quantify model uncertainty.*
3. *Threshold flexibility: Categories (Good, Moderate, Unhealthy, etc.) can be derived dynamically post-prediction without losing continuous fidelity.*

---

### 3. How was the dataset cleaned and preprocessed?
*We ingested authentic hourly observations from the Copernicus Atmosphere Monitoring Service (CAMS) and Open-Meteo across 5 global urban stations. The cleaning pipeline:*
- *Harmonized multi-source timestamps into UTC with ISO-8601 parsing.*
- *Applied physical sanity bounds: Non-negative concentrations, clamping PM2.5 to $\le 1200\ \mu\text{g/m}^3$, PM10 to $\le 1500\ \mu\text{g/m}^3$, and wind speeds to physically realistic ranges.*
- *Standardized feature scales using `StandardScaler` for regularized linear baselines.*

---

### 4. How were missing values handled in the time-series?
*In environmental sensor telemetry, missing values typically arise from momentary telemetry dropped packets or sensor maintenance. We applied bounded linear interpolation for short gaps ($\le 3$ hours), followed by forward-fill and backward-fill within respective station groups. Grouping by station ensures that missing observations in Delhi are never imputed using observations from London.*

---

### 5. How were features engineered?
*We engineered 21 features across three temporal and meteorological dimensions:*
1. *Cyclical Calendar Features: $\sin(2\pi \cdot \text{hour} / 24)$ and $\cos(2\pi \cdot \text{hour} / 24)$ preserve diurnal continuity (hour 23 is adjacent to hour 0). Added `day_of_week`, `is_weekend`, and `month`.*
2. *Autoregressive Lags: 1-hour lag (`pm25_lag1`, `pm10_lag1`) captures immediate momentum; 24-hour lag (`pm25_lag24`) captures diurnal periodicity.*
3. *Rolling Averages: 6-hour moving average (`pm25_roll_mean_6h`) smooths high-frequency sensor noise; 24-hour moving baseline (`aqi_roll_mean_24h`) captures regional background smog.*
4. *Meteorological Interactions: Surface temperature, relative humidity, and wind dispersion velocity.*

---

### 6. How was the Train/Test split performed?
*We performed a **strict chronological temporal split**: For every station, the earliest 80% of sequential records were assigned to the training set ($t \le T_{\text{split}}$), and the latest 20% future records were reserved exclusively for evaluation ($t > T_{\text{split}}$).*

---

### 7. How was Data Leakage strictly avoided?
*Data leakage occurs if future information inadvertently influences training features. We prevented it through:*
- *Strict backward-looking windows: All rolling calculations use `shift(1)`, guaranteeing that record at time $t$ only uses observations from $t-1, t-2, \dots$*
- *No future lookahead or target leakage: The target `target_aqi_24h` is shifted forward by 24 hours ($t+24$) and strictly excluded from the feature matrix $X$.*
- *No random shuffling: K-fold shuffle cross-validation was forbidden because random splitting leaks future temporal correlations into training folds.*

---

### 8. Why was the champion model chosen?
*We evaluated three candidate architectures:*
1. *Baseline Ridge Regression ($\alpha=1.0$)*
2. *Random Forest Regressor ($n=100, \text{max\_depth}=12$)*
3. *Gradient Tree Boosting ($n=120, \text{lr}=0.08, \text{max\_depth}=5$)*

*On out-of-sample holdout validation, Ridge Regression achieved an $R^2$ of 0.6299 and RMSE of 26.58 AQI, outperforming unconstrained tree ensembles which exhibited mild overfitting on localized seasonal shifts. The champion model was selected strictly on out-of-sample RMSE minimization.*

---

### 9. What do MAE, RMSE, and $R^2$ mean in this context?
- **MAE (Mean Absolute Error)**: *Average magnitude of forecast errors in AQI units. An MAE of 17.5 means our prediction is on average within 17.5 AQI points of the real future index.*
- **RMSE (Root Mean Squared Error)**: *Penalizes large errors quadratically. An RMSE of 26.58 ensures our model rarely produces catastrophic runaway errors.*
- **$R^2$ (Coefficient of Determination)**: *Measures the proportion of target variance explained by our feature space. An $R^2$ of 0.63 indicates that 63% of future AQI variability is captured by our features.*

---

### 10. How was Feature Importance calculated?
*For tree-based models, we extracted Gini impurity / variance reduction splits. For regularized linear models, we normalized standardized absolute coefficients $|\beta_j| / \sum |\beta_k|$. Features are ranked and displayed as relative percentage weights (e.g. PM2.5 24h rolling trend accounts for ~45% of predictive weight). We explicitly communicate to users that weights indicate statistical importance in the regression model, not verified environmental causality.*

---

### 11. Why does ML perform the prediction instead of an LLM?
*Large Language Models are probabilistic auto-regressive token predictors trained on textual corpora; they cannot reliably perform numerical mathematical optimization or complex regression over tabular floating-point time-series. Asking an LLM to predict numerical AQI leads to arithmetic hallucination. ML models are mathematically proven statistical regressors.*

---

### 12. What role does the LLM play in AirGuard AI?
*The Generative AI layer is dedicated to:*
1. *Context synthesis: Translating complex regression outputs, prediction intervals, and feature importance bars into plain-English explanations.*
2. *Non-technical explanation: Answering user questions such as "Why is AQI predicted to increase tomorrow?" by interpreting the underlying factors.*
3. *Actionable environmental health guidance: Generating demographic precautions.*

---

### 13. How is LLM Hallucination prevented?
*Through **Context-Grounded In-Prompt Injection**: When a user queries "Ask AirGuard", the Spring Boot backend queries PostgreSQL for the station's exact real-time telemetry (AQI, PM2.5, PM10, wind velocity, model factor rankings) and injects this structured JSON payload directly into the system prompt with strict system instructions: "You must answer using these exact numbers only; never invent statistics."*

---

### 14. How does Spring Boot communicate with FastAPI?
*Using Spring WebFlux's non-blocking `WebClient`. Spring Boot acts as the API Gateway and Orchestrator. When a client requests `POST /api/ml/predict`, Spring Boot serializes the telemetry into a JSON payload, performs an HTTP POST to FastAPI `:8000`, receives the prediction, and coordinates with the database and AI service before responding to the React frontend.*

---

### 15. Why was PostgreSQL chosen as the database?
- *ACID compliance: Guarantees transactional consistency for sensor telemetry and prediction audit logs.*
- *Strong relational constraints: Foreign keys (`city_id`), unique constraints (`uq_city_timestamp`), and referential integrity.*
- *Mature indexing: Composite B-tree indexing on `(city_id, timestamp DESC)` ensures sub-millisecond retrieval of 72-hour sliding windows across millions of rows.*

---

### 16. How are API keys and secrets secured?
- *Zero secrets committed to Git: All credentials (`AI_API_KEY`, `DB_PASSWORD`) are loaded via environment variables or Spring Boot `application.yml` property overrides.*
- *Architectural shielding: React never talks directly to third-party LLM or weather APIs. All external calls pass through Spring Boot, ensuring API tokens remain securely server-side.*

---

### 17. How is external API data handled?
*The backend checks database timestamp freshness. If the latest record for a station is recent, it is served instantly from PostgreSQL. If telemetry is stale, Spring Boot initiates an asynchronous fetch from Copernicus/Open-Meteo, parses the response, cleanses outliers, computes standard EPA sub-indices, and upserts the records into PostgreSQL using batch transactions.*

---

### 18. How does the application handle downstream API failures?
- *FastAPI offline: Spring Boot detects connection timeouts and seamlessly activates a domain-aware regression fallback estimator so the dashboard never crashes.*
- *LLM API offline / no API key: AIService automatically routes to an expert rule-based environmental knowledge engine implementing EPA health benchmarks.*
- *Client error handling: Centralized `@RestControllerAdvice` returns uniform `ApiResponse.error()` JSON envelopes with informative error codes instead of exposing internal stack traces.*

---

### 19. How is the database indexed for high performance?
*We created composite B-tree index `idx_aq_city_timestamp` on `air_quality_records(city_id, timestamp DESC)`. This satisfies equality filtering on `city_id` and range/ordering operations on `timestamp` without temporary sorting in memory. We also index `predictions(city_id, prediction_time DESC)` for instant audit log lookups.*

---

### 20. How could this system scale to handle 100,000+ cities globally?
1. *TimescaleDB / PostgreSQL Table Partitioning: Partition `air_quality_records` by monthly time ranges (`PARTITION BY RANGE (timestamp)`).*
2. *Distributed Caching: Place Redis in front of Spring Boot to cache current AQI and 72h historical curves with a 15-minute TTL.*
3. *Message Queue Decoupling: Ingest real-time sensor streams via RabbitMQ/Kafka, allowing batch database writes.*
4. *Horizontal ML Scaling: Containerize FastAPI with Triton Inference Server or ONNX Runtime behind a Kubernetes cluster for sub-10ms model execution.*
