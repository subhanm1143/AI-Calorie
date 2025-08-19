from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from typing import Union

app = FastAPI(title="Calories Burnt Predictor", version="1.0.0")

# TODO: when live, replace "*" with your Firebase domain:
# e.g., ["https://your-site.web.app", "https://your-site.firebaseapp.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load trained pipeline ---
BUNDLE = joblib.load("calories_model.pkl")
PIPE = BUNDLE["pipe"]
FEATURE_ORDER = BUNDLE.get("feature_order", ["Age","Height","Gender","Heart_Rate","Body_Temp"])

class Payload(BaseModel):
    # Accepts numeric (0/1) OR "male"/"female" — we'll normalize below.
    Age: float = Field(..., ge=10, le=100)
    Gender: Union[float, str]
    Height: float = Field(..., ge=120, le=220)
    Weight: float | None = None      # accepted but ignored by model
    Duration: float | None = None    # accepted but ignored by model
    Heart_Rate: float = Field(..., ge=40, le=220)
    Body_Temp: float = Field(..., ge=30, le=45)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/predict")
def predict(p: Payload):
    full = pd.DataFrame([p.model_dump()])

    # Normalize Gender if it arrives as string
    if "Gender" in full.columns and full["Gender"].dtype == object:
        full["Gender"] = full["Gender"].str.lower().map({"male": 0, "female": 1}).astype(float)

    # Keep only the features used at train time (drops Weight & Duration)
    row = full[FEATURE_ORDER]

    pred = float(PIPE.predict(row)[0])
    return {"calories": pred}
