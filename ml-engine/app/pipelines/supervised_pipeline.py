import joblib
from sklearn.model_selection import train_test_split
from ..models.supervised.zoo import SupervisedModelZoo
from ..evaluation.metrics import evaluate_classification
import pandas as pd

def run_supervised_pipeline(df: pd.DataFrame, target_column: str, preprocessor_path: str, job_id: str):
    """
    Executes Phase 2 Supervised & Ensemble Engine.
    """
    # 1. Separate features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # 2. Load and Apply Phase 1 Preprocessor
    preprocessor = joblib.load(preprocessor_path)
    X_processed = preprocessor.transform(X)
    
    # 3. Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)
    
    # 4. Initialize Zoo & Train Models
    zoo = SupervisedModelZoo()
    zoo.tune_models(X_train, y_train)
    
    # 5. Build Ensembles
    zoo.build_ensemble(X_train, y_train)
    
    # 6. Evaluate all models
    evaluations = {}
    for name, model in zoo.best_estimators_.items():
        y_pred = model.predict(X_test)
        
        # Some models might not support predict_proba, fallback gracefully
        y_proba = None
        if hasattr(model, "predict_proba"):
            try:
                y_proba = model.predict_proba(X_test)
            except Exception:
                pass
                
        evaluations[name] = evaluate_classification(y_test, y_pred, y_proba)
        
    # 7. Save Models
    model_paths = zoo.save_models(f"/tmp/{job_id}")
    
    return {
        "model_paths": model_paths,
        "evaluations": evaluations
    }
