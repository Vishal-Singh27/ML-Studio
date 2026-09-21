import re

file_path = "ml-engine/app/pipelines/preprocessing.py"
with open(file_path, "r") as f:
    content = f.read()

eda_code = """
def compute_eda_summary(df: pd.DataFrame):
    '''Computes basic EDA statistics to send to the frontend.'''
    summary = {
        "num_rows": int(df.shape[0]),
        "num_cols": int(df.shape[1]),
        "features": [],
        "correlation_matrix": None
    }
    
    # Feature stats
    for col in df.columns:
        dtype = str(df[col].dtype)
        missing = int(df[col].isna().sum())
        missing_pct = round((missing / len(df)) * 100, 1)
        
        feature_stat = {
            "name": col,
            "type": dtype,
            "missing": missing,
            "missing_pct": missing_pct
        }
        
        if np.issubdtype(df[col].dtype, np.number):
            feature_stat["mean"] = float(df[col].mean()) if not pd.isna(df[col].mean()) else 0
            feature_stat["std"] = float(df[col].std()) if not pd.isna(df[col].std()) else 0
            feature_stat["min"] = float(df[col].min()) if not pd.isna(df[col].min()) else 0
            feature_stat["max"] = float(df[col].max()) if not pd.isna(df[col].max()) else 0
        else:
            feature_stat["unique"] = int(df[col].nunique())
            feature_stat["top"] = str(df[col].mode().iloc[0]) if not df[col].mode().empty else "N/A"
            
        summary["features"].append(feature_stat)
        
    # Correlation matrix for numericals
    num_df = df.select_dtypes(include=[np.number])
    if not num_df.empty and num_df.shape[1] > 1:
        corr = num_df.corr().round(2).fillna(0)
        # convert to list of dicts for easy frontend plotting
        matrix = []
        for col1 in corr.columns:
            for col2 in corr.index:
                matrix.append({
                    "x": col1,
                    "y": col2,
                    "value": float(corr.loc[col2, col1])
                })
        summary["correlation_matrix"] = matrix
        
    return summary
"""

if "compute_eda_summary" not in content:
    # Insert right before build_and_save_preprocessor
    content = content.replace("def build_and_save_preprocessor", eda_code + "\ndef build_and_save_preprocessor")
    
# Now update run_preprocessing_pipeline
old_run = """def run_preprocessing_pipeline(df: pd.DataFrame, target_column: str = None, job_id: str = "default_job"):
    \"\"\"
    End-to-end execution of Phase 1 operations.
    \"\"\"
    # 1. Generate EDA Report
    profile_path = f"/tmp/{job_id}_profile.json"
    generate_profile(df, profile_path)
    
    # 2. Handle Outliers
    df_clean = remove_outliers_zscore(df)
    
    # 3. Build & Persist Dynamic Preprocessor
    preprocessor_path = f"/tmp/{job_id}_preprocessor.joblib"
    build_and_save_preprocessor(df_clean, target_column, preprocessor_path)
    
    return {
        "profile_path": profile_path,
        "preprocessor_path": preprocessor_path,
        "original_shape": df.shape,
        "cleaned_shape": df_clean.shape
    }"""

new_run = """def run_preprocessing_pipeline(df: pd.DataFrame, target_column: str = None, job_id: str = "default_job"):
    \"\"\"
    End-to-end execution of Phase 1 operations.
    \"\"\"
    # 1. Generate EDA Summary
    eda_summary = compute_eda_summary(df)
    
    # 2. Handle Outliers
    df_clean = remove_outliers_zscore(df)
    
    # 3. Build & Persist Dynamic Preprocessor
    preprocessor_path = f"/tmp/{job_id}_preprocessor.joblib"
    build_and_save_preprocessor(df_clean, target_column, preprocessor_path)
    
    # Determine what was done for the UI
    num_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df_clean.select_dtypes(exclude=[np.number]).columns.tolist()
    if target_column in feature_cols := df_clean.columns.tolist():
        feature_cols.remove(target_column)
        
    log = []
    log.append(f"Z-Score outlier removal dropped {df.shape[0] - df_clean.shape[0]} rows.")
    if len(num_cols) > 0:
        log.append(f"Imputed {len(num_cols)} numerical features with Median.")
        log.append(f"Scaled {len(num_cols)} numerical features using StandardScaler.")
    if len(cat_cols) > 0:
        log.append(f"Imputed {len(cat_cols)} categorical features with Mode.")
        log.append(f"One-Hot Encoded {len(cat_cols)} categorical features.")
        
    return {
        "preprocessor_path": preprocessor_path,
        "original_shape": df.shape,
        "cleaned_shape": df_clean.shape,
        "eda": eda_summary,
        "logs": log
    }"""

content = content.replace(old_run, new_run)

with open(file_path, "w") as f:
    f.write(content)

