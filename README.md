# 🏋️ AI Calorie Predictor

This project is a **full-stack machine learning web app** that predicts how many calories a person burns during a workout based on their biological measures.  
It includes:

- **ML Backend (FastAPI + Python)** → trained regression model served via REST API  
- **Frontend (Firebase Hosting + vanilla JS)** → simple web form to input personal workout details  
- **Deployment (Render + Firebase)** → backend runs on [Render](https://render.com), frontend runs on [Firebase Hosting](https://firebase.google.com/)

---

## 🚀 Live Demo
- Frontend: **[Firebase Hosted Site](https://ai-calorie-predictor.web.app)**  
- Backend: **[FastAPI Docs](https://ai-calorie.onrender.com/docs)**  

---

## 📊 Features
- Accepts user inputs:
  - Age
  - Gender
  - Height (cm)
  - Weight (kg)
  - Duration (minutes)
  - Heart Rate (bpm)
  - Body Temperature (°C)
- Predicts **Calories Burnt** using an **XGBoost regression model**
- Clean, responsive UI
- Handles API cold starts (Render free plan) gracefully
- Mock mode for testing UI without live API

---

## 🧠 Machine Learning Model
- **Dataset**: `Calories.csv` + `Exercise.csv` merged  
- **Preprocessing**:
  - Encoding gender
  - Dropping highly correlated features to avoid leakage
  - Standard scaling
- **Models Tested**:
  - Linear Regression
  - Lasso, Ridge
  - RandomForestRegressor
  - XGBRegressor ✅ (best performance)
- **Validation MAE**: ~**10.1** kcal

Training script: [`train_and_export.py`](ml-api/train_and_export.py)  
Model saved with `joblib` → [`calories_model.pkl`](ml-api/calories_model.pkl)

---

## 🛠️ Tech Stack
### Backend
- [Python 3.11](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/) — REST API
- [scikit-learn](https://scikit-learn.org/)
- [XGBoost](https://xgboost.ai/)
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

### Frontend
- HTML / CSS / JavaScript
- Hosted on Firebase Hosting

### Deployment
- **API**: [Render](https://render.com/) (Free Web Service)
- **Frontend**: Firebase Hosting

---

## 📂 Project Structure
