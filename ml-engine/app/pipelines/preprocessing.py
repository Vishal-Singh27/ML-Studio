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


def compute_eda_summary(df: pd.DataFrame):
    '''Computes rich EDA statistics to send to the frontend.'''
    summary = {
        "num_rows": int(df.shape[0]),
        "num_cols": int(df.shape[1]),
        "num_duplicates": int(df.duplicated().sum()),
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
            col_data = df[col].dropna()
            feature_stat["mean"] = round(float(col_data.mean()), 4) if len(col_data) > 0 else 0
            feature_stat["std"] = round(float(col_data.std()), 4) if len(col_data) > 0 else 0
            feature_stat["min"] = round(float(col_data.min()), 4) if len(col_data) > 0 else 0
            feature_stat["max"] = round(float(col_data.max()), 4) if len(col_data) > 0 else 0
            feature_stat["median"] = round(float(col_data.median()), 4) if len(col_data) > 0 else 0

            # Skewness and Kurtosis
            feature_stat["skewness"] = round(float(col_data.skew()), 3) if len(col_data) > 2 else 0
            feature_stat["kurtosis"] = round(float(col_data.kurt()), 3) if len(col_data) > 3 else 0

            # IQR-based outlier count
            q1 = float(col_data.quantile(0.25))
            q3 = float(col_data.quantile(0.75))
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            feature_stat["outlier_count"] = int(((col_data < lower) | (col_data > upper)).sum())
            feature_stat["q1"] = round(q1, 4)
            feature_stat["q3"] = round(q3, 4)

            # Histogram bins (10 bins)
            counts, bin_edges = np.histogram(col_data, bins=10)
            feature_stat["histogram"] = [
                {"bin": f"{bin_edges[i]:.1f}", "count": int(counts[i])}
                for i in range(len(counts))
            ]
        else:
            feature_stat["unique"] = int(df[col].nunique())
            feature_stat["top"] = str(df[col].mode().iloc[0]) if not df[col].mode().empty else "N/A"
            vc = df[col].value_counts().head(10)
            feature_stat["value_counts"] = [{"label": str(k), "count": int(v)} for k, v in vc.items()]

        summary["features"].append(feature_stat)

    # Correlation matrix for numericals
    num_df = df.select_dtypes(include=[np.number])
    if not num_df.empty and num_df.shape[1] > 1:
        corr = num_df.corr().round(2).fillna(0)
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
    feature_cols = df_clean.columns.tolist()
    if target_column in feature_cols:
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
    }
