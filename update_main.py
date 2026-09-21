with open("ml-engine/app/main.py", "r") as f:
    content = f.read()

# Add joblib import if not there
if "import joblib" not in content:
    content = content.replace("import pandas as pd", "import pandas as pd\nimport joblib")

# Add PredictRequest class
if "class PredictRequest" not in content:
    pred_req = """
class PredictRequest(BaseModel):
    job_id: str
    model_name: str
    features: dict
"""
    content = content.replace("class TrainRequest", pred_req + "class TrainRequest")

# Add /predict route
if "@app.post(\"/predict\")" not in content:
    pred_route = """
@app.post("/predict")
def predict_single(request: PredictRequest):
    try:
        # Load preprocessor
        preprocessor_path = f"/tmp/{request.job_id}_preprocessor.joblib"
        preprocessor = joblib.load(preprocessor_path)
        
        # Load model
        model_path = f"/tmp/{request.job_id}_{request.model_name}.joblib"
        model = joblib.load(model_path)
        
        # Convert single dictionary row to DataFrame
        df = pd.DataFrame([request.features])
        
        # Transform features
        X_processed = preprocessor.transform(df)
        
        # Predict
        pred = model.predict(X_processed)[0]
        
        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(X_processed)[0].tolist()
            except Exception:
                pass
                
        return {"prediction": str(pred), "probabilities": proba}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
"""
    content += pred_route

with open("ml-engine/app/main.py", "w") as f:
    f.write(content)
print("Updated main.py")
