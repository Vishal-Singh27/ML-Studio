from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np

router = APIRouter()

class AuditRequest(BaseModel):
    dataset_path: str
    target_column: str | None = None

@router.post("/audit")
def audit_dataset(request: AuditRequest):
    try:
        df = pd.read_csv(request.dataset_path)
        
        issues = []
        
        # 1. Check for ID-like columns (high cardinality, non-numeric or evenly distributed integers)
        for col in df.columns:
            if col == request.target_column:
                continue
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio > 0.95 and df[col].dtype in [object, np.int64]:
                issues.append({
                    "type": "high_cardinality",
                    "column": col,
                    "description": f"Appears to be an ID column (95%+ unique values). Strongly consider dropping this to prevent overfitting."
                })
                
        # 2. Constant columns
        for col in df.columns:
            if df[col].nunique() <= 1:
                issues.append({
                    "type": "constant_column",
                    "column": col,
                    "description": f"Has only 1 unique value. It provides no predictive power."
                })
                
        # 3. Target Leakage (High correlation with target)
        if request.target_column and request.target_column in df.columns:
            target_series = df[request.target_column]
            if pd.api.types.is_numeric_dtype(target_series):
                for col in df.columns:
                    if col != request.target_column and pd.api.types.is_numeric_dtype(df[col]):
                        corr = abs(df[col].corr(target_series))
                        if corr > 0.9:
                            issues.append({
                                "type": "target_leakage",
                                "column": col,
                                "description": f"Suspiciously high correlation ({corr:.2f}) with the target. This feature might be a proxy for the label (Data Leakage)."
                            })
                            
        # 4. Semantic Missing Values (-999, "N/A", etc.)
        for col in df.columns:
            if df[col].dtype == object:
                suspicious = df[col].isin(["N/A", "NA", "null", "?", ""]).sum()
                if suspicious > 0:
                    issues.append({
                        "type": "semantic_missing",
                        "column": col,
                        "description": f"Contains text indicating missing values ('?', 'N/A'). You should standardize these to actual nulls."
                    })
            elif pd.api.types.is_numeric_dtype(df[col]):
                suspicious = df[col].isin([-999, -9999, 9999]).sum()
                if suspicious > 0:
                    issues.append({
                        "type": "semantic_missing",
                        "column": col,
                        "description": f"Contains extreme values like -999 which usually represent missing data."
                    })
                    
        # 5. Class Imbalance (Classification)
        if request.target_column and request.target_column in df.columns:
            target_series = df[request.target_column]
            if target_series.nunique() < 10:  # likely classification
                counts = target_series.value_counts(normalize=True)
                if counts.min() < 0.1:
                    issues.append({
                        "type": "class_imbalance",
                        "column": request.target_column,
                        "description": f"Severe class imbalance. The minority class is {counts.min()*100:.1f}% of the data. Consider SMOTE or class weights."
                    })
                    
        return {"status": "success", "issues": issues, "shape": df.shape}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
