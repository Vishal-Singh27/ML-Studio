import pandas as pd
import numpy as np
import joblib
from scipy import stats
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from ydata_profiling import ProfileReport

def generate_profile(df: pd.DataFrame, output_json_path: str):
    """
    Generates an EDA profile using ydata-profiling.
    Saves the output as a JSON file so the frontend can parse and render custom interactive UI
    instead of displaying static HTML.
    """
    # minimal=True speeds up processing and reduces output size, which is good for async pipelines
    profile = ProfileReport(df, title="Dataset Profiling Report", minimal=True)
    profile.to_file(output_json_path)
    return output_json_path

def remove_outliers_zscore(df: pd.DataFrame, threshold: float = 3.0) -> pd.DataFrame:
    """
    Detects and removes outliers using the Z-score method on numerical columns.
    Missing values are temporarily ignored during Z-score calculation to avoid dropping rows unnecessarily.
    """
    df_clean = df.copy()
    num_cols = df_clean.select_dtypes(include=[np.number]).columns
    
    if len(num_cols) == 0:
        return df_clean
        
    for col in num_cols:
        col_std = df_clean[col].std(ddof=0)
        if col_std > 0:
            col_zscore = np.abs((df_clean[col] - df_clean[col].mean()) / col_std)
            # Keep rows where z-score < threshold or the value is NaN
            df_clean = df_clean[(col_zscore < threshold) | (df_clean[col].isna())]
            
    return df_clean

def build_and_save_preprocessor(df: pd.DataFrame, target_column: str = None, save_path: str = "preprocessor.joblib") -> ColumnTransformer:
    """
    Builds a dynamic ColumnTransformer for categorical encoding and numerical scaling.
    Fits the transformer on the provided DataFrame and persists it via joblib.
    """
    feature_cols = df.columns.tolist()
    if target_column and target_column in feature_cols:
        feature_cols.remove(target_column)
        
    X = df[feature_cols]
    
    # Dynamically identify column types
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # Numerical pipeline: Impute missing values with median, then scale
    num_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Categorical pipeline: Impute missing values with mode, then OneHotEncode
    cat_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Combine into a single ColumnTransformer
    preprocessor = ColumnTransformer(transformers=[
        ('num', num_pipeline, num_cols),
        ('cat', cat_pipeline, cat_cols)
    ], remainder='drop')
    
    # Fit the preprocessor
    preprocessor.fit(X)
    
    # Save the pipeline for future inference
    joblib.dump(preprocessor, save_path)
    
    return preprocessor

def run_preprocessing_pipeline(df: pd.DataFrame, target_column: str = None, job_id: str = "default_job"):
    """
    End-to-end execution of Phase 1 operations.
    """
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
    }
