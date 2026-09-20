from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import requests
from .routing import determine_task_type
from .pipelines.preprocessing import run_preprocessing_pipeline

app = FastAPI(title="ML Studio Engine", version="1.0.0")

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
