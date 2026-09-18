import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import psycopg2

from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

from src.feature_engineering import FEATURE_COLUMNS, engineer_features

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "air_quality_cleaned.csv")
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456789")
DB_NAME = os.getenv("DB_NAME", "airguard_db")

def train_and_evaluate():
    print("==================================================")
    print("  AirGuard AI: ML Training & Evaluation Pipeline  ")
    print("==================================================")

    os.makedirs(MODELS_DIR, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Cleaned dataset not found at {DATA_PATH}. Run 'python data/ingest.py' first.")

    print(f"Loading dataset from: {DATA_PATH}")
    raw_df = pd.read_csv(DATA_PATH)
    print(f"Raw rows: {len(raw_df):,}")

    # Feature Engineering
    print("Engineering lag, cyclical, and rolling atmospheric features...")
    df = engineer_features(raw_df, is_training=True)
    print(f"Processed dataset shape: {df.shape}")
    print(f"Features: {FEATURE_COLUMNS}")

    # Chronological Train-Test Split (avoid data leakage)
    print("\nApplying temporal chronological train-test split (80% train, 20% test per city)...")
    train_dfs = []
    test_dfs = []

    for city, city_df in df.groupby("city_name"):
        city_sorted = city_df.sort_values("time").reset_index(drop=True)
        split_idx = int(len(city_sorted) * 0.8)
        train_dfs.append(city_sorted.iloc[:split_idx])
        test_dfs.append(city_sorted.iloc[split_idx:])

    train_data = pd.concat(train_dfs, ignore_index=True)
    test_data = pd.concat(test_dfs, ignore_index=True)

    X_train = train_data[FEATURE_COLUMNS]
    y_train = train_data["target_aqi_24h"]
    X_test = test_data[FEATURE_COLUMNS]
    y_test = test_data["target_aqi_24h"]

    print(f"Training samples: {len(X_train):,}")
    print(f"Testing samples:  {len(X_test):,}")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Define Candidate Models
    candidate_models = {
        "Baseline (Ridge Regression)": {
            "model": Ridge(alpha=1.0),
            "use_scaled": True,
            "filename": "baseline_lr.joblib"
        },
        "Random Forest Regressor": {
            "model": RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_split=5, random_state=42, n_jobs=-1),
            "use_scaled": False,
            "filename": "aqi_model_rf.joblib"
        },
        "Gradient Boosting Regressor": {
            "model": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42),
            "use_scaled": False,
            "filename": "aqi_model_gb.joblib"
        }
    }

    results = {}
    best_model_name = None
    best_rmse = float("inf")

    for name, config in candidate_models.items():
        print(f"\n[+] Training {name}...")
        clf = config["model"]
        X_tr = X_train_scaled if config["use_scaled"] else X_train
        X_te = X_test_scaled if config["use_scaled"] else X_test

        clf.fit(X_tr, y_train)
        y_pred = clf.predict(X_te)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        print(f"    MAE:  {mae:.2f}")
        print(f"    RMSE: {rmse:.2f}")
        print(f"    R2:   {r2:.4f}")

        # Feature Importance Calculation
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_
            feat_imp = {feat: float(imp) for feat, imp in zip(FEATURE_COLUMNS, importances)}
        elif hasattr(clf, "coef_"):
            # Linear model absolute normalized coefficients
            coef_abs = np.abs(clf.coef_)
            total = np.sum(coef_abs) if np.sum(coef_abs) > 0 else 1.0
            feat_imp = {feat: float(c / total) for feat, c in zip(FEATURE_COLUMNS, coef_abs)}
        else:
            feat_imp = {feat: 1.0 / len(FEATURE_COLUMNS) for feat in FEATURE_COLUMNS}

        results[name] = {
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2": round(float(r2), 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "feature_importances": feat_imp,
            "filename": config["filename"]
        }

        # Persist model artifact
        save_payload = {
            "name": name,
            "version": "1.2.0",
            "model": clf,
            "scaler": scaler if config["use_scaled"] else None,
            "features": FEATURE_COLUMNS,
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "feature_importances": feat_imp,
            "trained_at": datetime.now().isoformat()
        }
        joblib.dump(save_payload, os.path.join(MODELS_DIR, config["filename"]))
        print(f"    Saved model payload to: {config['filename']}")

        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name

    print(f"\n[*] Selected Best Model: {best_model_name} (RMSE: {best_rmse:.2f})")

    # Persist summary metrics JSON
    metrics_summary = {
        "best_model": best_model_name,
        "trained_at": datetime.now().isoformat(),
        "total_training_records": len(X_train),
        "total_testing_records": len(X_test),
        "features_count": len(FEATURE_COLUMNS),
        "models": results
    }
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")

    # Persist metrics to PostgreSQL model_metrics table
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        cursor.execute("DELETE FROM model_metrics;")
        for m_name, m_data in results.items():
            cursor.execute("""
                INSERT INTO model_metrics (model_name, model_type, mae, rmse, r2, train_samples, test_samples, features_json, trained_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                m_name,
                "Regression",
                m_data["mae"],
                m_data["rmse"],
                m_data["r2"],
                m_data["train_samples"],
                m_data["test_samples"],
                json.dumps(m_data["feature_importances"])
            ))
        conn.commit()
        cursor.close()
        conn.close()
        print("Model metrics recorded in PostgreSQL 'model_metrics' table.")
    except Exception as e:
        print(f"[!] Note: Could not write metrics to DB: {e}")

if __name__ == "__main__":
    train_and_evaluate()
