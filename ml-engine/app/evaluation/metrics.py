from sklearn.metrics import confusion_matrix, roc_curve, roc_auc_score, f1_score, mean_squared_error, accuracy_score, classification_report
import numpy as np

def evaluate_classification(y_true, y_pred, y_proba=None):
    """
    Calculates metrics and formats them as raw JSON-friendly arrays for UI rendering
    (e.g., Recharts / Plotly).
    """
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "f1_score": float(f1_score(y_true, y_pred, average='weighted')),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
    }
    
    try:
        clf_rep = classification_report(y_true, y_pred, output_dict=True)
        metrics["classification_report"] = clf_rep
    except Exception:
        pass

    # Calculate RMSE (Even though it's typically for regression, we calculate it if requested)
    try:
        metrics["rmse"] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    except ValueError:
        # Fails if labels are strings
        pass
        
    if y_proba is not None:
        try:
            # Handle multi-class vs binary classification
            if len(y_proba.shape) > 1 and y_proba.shape[1] > 2:
                # Multi-class One-vs-Rest AUC
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba, multi_class='ovr', average='macro'))
            else:
                # Binary classification
                probs = y_proba[:, 1] if len(y_proba.shape) > 1 else y_proba
                metrics["roc_auc"] = float(roc_auc_score(y_true, probs))
                
                fpr, tpr, thresholds = roc_curve(y_true, probs)
                
                # Format ROC curve points as a JSON array for interactive Recharts UI
                roc_points = [{"fpr": float(f), "tpr": float(t)} for f, t in zip(fpr, tpr)]
                metrics["roc_curve"] = roc_points
        except Exception as e:
            metrics["roc_error"] = str(e)
            
    return metrics
