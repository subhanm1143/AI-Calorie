# train_and_export.py
# Usage examples:
#   python train_and_export.py --calories ./Calories.csv --exercise ./Exercise.csv
#   python train_and_export.py --calories ./calories.csv
#   python train_and_export.py --model rf   # use RandomForest instead of XGB
#
# Outputs:
#   ml-api/calories_model.pkl   (sklearn Pipeline + feature order)

import os
import argparse
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error as MAE
from sklearn.ensemble import RandomForestRegressor

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except Exception:
    HAS_XGB = False


def load_data(calories_path: str, exercise_path: str | None):
    """
    If both CSVs are provided, merge on 'User_ID'.
    Otherwise, load the single calories CSV (already merged in many datasets).
    """
    df = pd.read_csv(calories_path)
    if exercise_path:
        ex = pd.read_csv(exercise_path)
        # Inner join on User_ID; adjust if your keys differ
        df = pd.merge(df, ex, on="User_ID", how="inner")
    return df


def prepare_dataframe(df: pd.DataFrame):
    """
    Apply the same preprocessing choices as your article:
    - Encode Gender ('male'->0, 'female'->1) if it's text
    - Drop leakage columns: Weight, Duration
    - Split features/target; remove User_ID from features
    """
    # Encode gender if needed
    if "Gender" in df.columns and df["Gender"].dtype == object:
        df["Gender"] = df["Gender"].str.lower().map({"male": 0, "female": 1}).astype(float)

    # Drop leakage columns if they exist
    for col in ["Weight", "Duration"]:
        if col in df.columns:
            df = df.drop(columns=[col])

    # Basic sanity checks
    required = {"User_ID", "Calories"}
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}. Columns present: {list(df.columns)}")

    # Features/target
    X = df.drop(columns=["User_ID", "Calories"])
    y = df["Calories"].values

    # Order features deterministically for saving
    feature_order = list(X.columns)

    return X, y, feature_order


def build_model(kind: str):
    if kind == "rf":
        return Pipeline([
            ("scaler", StandardScaler()),
            ("model", RandomForestRegressor(
                n_estimators=500,
                max_depth=None,
                random_state=42,
                n_jobs=-1
            ))
        ])
    # default to xgb
    if not HAS_XGB:
        raise RuntimeError("xgboost not installed. Install it or use --model rf")
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model", XGBRegressor(
            n_estimators=800,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=-1,
            tree_method="hist"
        ))
    ])


def main():
    ap = argparse.ArgumentParser(description="Train and export Calories predictor")
    ap.add_argument("--calories", required=True, help="Path to Calories.csv (or merged CSV)")
    ap.add_argument("--exercise", default=None, help="Path to Exercise.csv (optional)")
    ap.add_argument("--model", choices=["xgb", "rf"], default="xgb", help="Model type (xgb or rf)")
    ap.add_argument("--test_size", type=float, default=0.10, help="Validation split size (default 0.10)")
    ap.add_argument("--out", default="ml-api/calories_model.pkl", help="Output model path")
    args = ap.parse_args()

    print("📥 Loading data…")
    df = load_data(args.calories, args.exercise)

    print("🧹 Preparing dataframe…")
    X, y, feature_order = prepare_dataframe(df)

    print("🔀 Splitting train/val…")
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=args.test_size, random_state=22
    )

    print(f"🤖 Building model ({args.model.upper()})…")
    pipe = build_model(args.model)

    print("🏋️ Training…")
    pipe.fit(X_tr, y_tr)

    print("🧪 Evaluating…")
    preds = pipe.predict(X_val)
    mae = MAE(y_val, preds)
    print(f"MAE (validation): {mae:.4f}")

    bundle = {"pipe": pipe, "feature_order": feature_order}

    out_path = args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(bundle, out_path)
    print(f"💾 Saved model bundle → {out_path}")
    print(f"🧱 Feature order: {feature_order}")


if __name__ == "__main__":
    main()
