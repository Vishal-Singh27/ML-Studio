import joblib
from sklearn.model_selection import train_test_split
from ..models.supervised.zoo import SupervisedModelZoo
from ..evaluation.metrics import evaluate_classification
import pandas as pd

def run_supervised_pipeline(df: pd.DataFrame, target_column: str, preprocessor_path: str, job_id: str):
    """
    Executes Phase 2 Supervised & Ensemble Engine.
    Passes raw X and unfitted preprocessor to the Zoo to prevent data leakage.
    """
    # 1. Separate features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # 2. Load Phase 1 Preprocessor (Unfitted version will be cloned)
    preprocessor = joblib.load(preprocessor_path)
    
    # 3. Train/Test Split (80/20) on RAW data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Initialize Zoo & Train Models with Pipeline
    zoo = SupervisedModelZoo()
    zoo.tune_models(X_train, y_train, preprocessor=preprocessor)
    
    # 5. Build Ensembles
    zoo.build_ensemble(X_train, y_train)
    
    # 6. Evaluate all models
    evaluations = {}
    
    for name, model in zoo.best_estimators_.items():
        y_pred = model.predict(X_test)
        
        y_proba = None
        if hasattr(model, "predict_proba"):
            try:
                y_proba = model.predict_proba(X_test)
            except Exception:
                pass
                
        evals = evaluate_classification(y_test, y_pred, y_proba)
        
        if hasattr(zoo, "cv_results_") and name in zoo.cv_results_:
            evals["cv_scores"] = zoo.cv_results_[name]
            
        # Clean up param names (remove 'model__' prefix for UI)
        if hasattr(zoo, "best_params_") and name in zoo.best_params_:
            params = zoo.best_params_[name]
            cleaned_params = {k.replace("model__", ""): v for k, v in params.items()}
            evals["best_params"] = cleaned_params
            
        # Add Feature Importances safely
        # model is now a Pipeline (or VotingClassifier wrapping pipelines)
        try:
            if hasattr(model, "named_steps"):
                core_model = model.named_steps["model"]
                core_preprocessor = model.named_steps["preprocessor"]
                
                if hasattr(core_model, "feature_importances_"):
                    importances = core_model.feature_importances_
                    feature_names = core_preprocessor.get_feature_names_out()
                    
                    feat_imp = [{"feature": fname, "importance": float(imp)} 
                                for fname, imp in zip(feature_names, importances)]
                    feat_imp = sorted(feat_imp, key=lambda x: x["importance"], reverse=True)
                    evals["feature_importance"] = feat_imp
        except Exception as e:
            pass
            
        evaluations[name] = evals
        
    # 7. Save Models
    model_paths = zoo.save_models(f"/tmp/{job_id}")
    
    return {
        "model_paths": model_paths,
        "evaluations": evaluations
    }
