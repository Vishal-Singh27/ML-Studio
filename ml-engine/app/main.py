from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import joblib
import requests
from .routing import determine_task_type
from .pipelines.preprocessing import run_preprocessing_pipeline
from .routers import audit

app = FastAPI(title="ML Studio Engine", version="1.0.0")
app.include_router(audit.router)


class PredictRequest(BaseModel):
    job_id: str
    model_name: str
    features: dict
class TrainRequest(BaseModel):
    job_id: str
    dataset_path: str
    target_column: Optional[str] = None
    webhook_url: str
    enable_dl: bool = False

def execute_ml_pipeline(job_id: str, dataset_path: str, target_column: str, webhook_url: str, enable_dl: bool):
    """
    Background worker function that executes the ML pipelines.
    Runs Phase 1 and determines the next task type.
    Fires a webhook back to the Node server upon completion.
    """
    try:
        # Simulate stateless execution: Read directly from the provided path
        # (In a real production app, this path would be an S3/Blob storage URL)
        df = pd.read_csv(dataset_path)
        
        # ---------------------------------------------------------
        # Data Doctor Audit (Pre-processing)
        # ---------------------------------------------------------
        audit_req = audit.AuditRequest(dataset_path=dataset_path, target_column=target_column)
        audit_results = audit.audit_dataset(audit_req)

        # ---------------------------------------------------------
        # Phase 1: Automated Data Processing
        # ---------------------------------------------------------
        preprocessing_results = run_preprocessing_pipeline(df, target_column, job_id)
        
        task_type = determine_task_type(target_column)
        
        # ---------------------------------------------------------
        # Phase 2: Supervised & Ensemble Engine
        # ---------------------------------------------------------
        supervised_results = None
        if task_type == "SUPERVISED":
            from .pipelines.supervised_pipeline import run_supervised_pipeline
            supervised_results = run_supervised_pipeline(
                df=df, 
                target_column=target_column, 
                preprocessor_path=preprocessing_results["preprocessor_path"],
                job_id=job_id
            )

        # ---------------------------------------------------------
        # Phase 3: Unsupervised Engine
        # ---------------------------------------------------------
        unsupervised_results = None
        if task_type == "UNSUPERVISED":
            from .pipelines.unsupervised_pipeline import run_unsupervised_pipeline
            unsupervised_results = run_unsupervised_pipeline(
                df=df,
                preprocessor_path=preprocessing_results["preprocessor_path"],
                job_id=job_id
            )

        # ---------------------------------------------------------
        # Phase 4: Deep Learning Module
        # ---------------------------------------------------------
        dl_results = None
        if task_type == "SUPERVISED" and enable_dl:
            from .pipelines.dl_pipeline import run_dl_pipeline
            dl_results = run_dl_pipeline(
                df=df,
                target_column=target_column,
                preprocessor_path=preprocessing_results["preprocessor_path"],
                job_id=job_id
            )

        # Compile final results
        payload = {
            "job_id": job_id,
            "status": "success",
            "task_type": task_type,
            "audit": audit_results,
            "preprocessing": preprocessing_results,
            "supervised_results": supervised_results,
            "unsupervised_results": unsupervised_results,
            "dl_results": dl_results
        }
    except Exception as e:
        payload = {
            "job_id": job_id,
            "status": "error",
            "message": str(e)
        }
        
    # Send webhook back to the orchestrator (Node.js)
    try:
        requests.post(webhook_url, json=payload)
    except Exception as e:
        print(f"Failed to send webhook to {webhook_url}: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml-engine"}

@app.post("/train")
def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """
    Accepts the job payload and immediately returns 202 Accepted.
    The actual processing happens in a non-blocking BackgroundTask.
    """
    try:
        background_tasks.add_task(
            execute_ml_pipeline, 
            request.job_id, 
            request.dataset_path, 
            request.target_column,
            request.webhook_url,
            request.enable_dl
        )
        
        return {
            "status": "accepted",
            "job_id": request.job_id,
            "message": "Pipeline execution started in the background."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Predict (model is now a Pipeline for Supervised tasks!)
        pred = model.predict(df)[0]
        
        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(df)[0].tolist()
            except Exception:
                pass
                
        # Calculate SHAP values
        shap_data = None
        try:
            if hasattr(model, "named_steps"):
                import shap
                core_model = model.named_steps["model"]
                core_preprocessor = model.named_steps["preprocessor"]
                
                X_processed = core_preprocessor.transform(df)
                feature_names = core_preprocessor.get_feature_names_out().tolist()
                
                # Check if it's a tree model
                import sklearn
                if isinstance(core_model, (sklearn.ensemble.RandomForestClassifier, sklearn.ensemble.GradientBoostingClassifier)):
                    explainer = shap.TreeExplainer(core_model)
                    
                    # shap_values can return different shapes depending on shap version and model type
                    shap_val = explainer.shap_values(X_processed)
                    
                    # For binary classification, shap_val is often a list of 2 arrays [shape(1, N), shape(1, N)]
                    if isinstance(shap_val, list):
                        # Use the explanation for the predicted class
                        class_idx = int(pred) if len(shap_val) > int(pred) else 1
                        shap_arr = shap_val[class_idx][0]
                    else:
                        if len(shap_val.shape) == 3:
                            class_idx = int(pred) if shap_val.shape[2] > int(pred) else 1
                            shap_arr = shap_val[0, :, class_idx]
                        else:
                            shap_arr = shap_val[0]
                            
                    shap_data = [{"feature": f, "value": float(v)} for f, v in zip(feature_names, shap_arr)]
                    shap_data = sorted(shap_data, key=lambda x: abs(x["value"]), reverse=True)[:10] # Top 10
        except Exception as e:
            print("SHAP calculation failed:", e)
            pass
                
        return {"prediction": str(pred), "probabilities": proba, "shap_values": shap_data}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
