import joblib
import pandas as pd
import numpy as np
from ..models.unsupervised.clustering import UnsupervisedTrack

def run_unsupervised_pipeline(df: pd.DataFrame, preprocessor_path: str, job_id: str):
    """
    Executes Phase 3 Unsupervised Engine.
    Triggered when the user leaves the target column blank.
    """
    # 1. Load and Apply Phase 1 Preprocessor
    preprocessor = joblib.load(preprocessor_path)
    # df is entirely features since there is no target column
    X_processed = preprocessor.transform(df)
    
    # 2. PCA (Dimensionality Reduction)
    pca_results = UnsupervisedTrack.apply_pca(X_processed)
    
    # 3. K-Means (Elbow & Silhouette)
    # If the dataset is too huge, KMeans might be slow, but usually fine for typical sizes.
    kmeans_results = UnsupervisedTrack.run_kmeans(X_processed)
    
    # 4. Hierarchical Clustering (Dendrogram Linkage)
    # The linkage matrix memory complexity is O(N^2), so we aggressively subsample 
    # if the dataset is too large to prevent the API from crashing.
    if X_processed.shape[0] > 1500:
        indices = np.random.choice(X_processed.shape[0], 1500, replace=False)
        X_sample = X_processed[indices]
    else:
        X_sample = X_processed
        
    hierarchical_results = UnsupervisedTrack.run_hierarchical(X_sample)
    
    return {
        "pca": pca_results,
        "kmeans": kmeans_results,
        "hierarchical": hierarchical_results
    }
