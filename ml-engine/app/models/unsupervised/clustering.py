import numpy as np
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from scipy.cluster.hierarchy import linkage

class UnsupervisedTrack:
    """
    Phase 3: Dimensionality Reduction and Clustering Algorithms.
    Formats outputs specifically for interactive Recharts/Plotly UI consumption.
    """
    
    @staticmethod
    def apply_pca(X, n_components=3):
        """
        Applies PCA and returns 2D/3D projections for scatter plotting.
        """
        n_comps = min(X.shape[1], n_components)
        pca = PCA(n_components=n_comps)
        transformed = pca.fit_transform(X)
        
        # Format projections as JSON array of objects
        points = []
        for row in transformed:
            point = {"x": float(row[0]) if n_comps > 0 else 0}
            if n_comps > 1: point["y"] = float(row[1])
            if n_comps > 2: point["z"] = float(row[2])
            points.append(point)
            
        return {
            "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
            "projections": points
        }
        
    @staticmethod
    def run_kmeans(X, max_clusters=10):
        """
        Runs K-Means to calculate Inertia (Elbow) and Silhouette scores.
        """
        max_k = min(X.shape[0] - 1, max_clusters)
        if max_k < 2: 
            return {"error": "Not enough data for clustering."}
        
        metrics = []
        for k in range(2, max_k + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)
            
            inertia = float(kmeans.inertia_)
            silhouette = float(silhouette_score(X, labels))
            
            metrics.append({
                "k": k,
                "inertia": inertia,
                "silhouette": silhouette
            })
            
        # Determine optimal K based on highest Silhouette score
        best_k = max(metrics, key=lambda x: x["silhouette"])["k"]
        best_kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        best_labels = best_kmeans.fit_predict(X)
        
        return {
            "elbow_silhouette_curve": metrics,
            "best_k": best_k,
            "best_labels": best_labels.tolist()
        }
        
    @staticmethod
    def run_hierarchical(X):
        """
        Generates the linkage matrix for plotting a Dendrogram on the frontend.
        """
        # SciPy's linkage is ideal for dendrogram generation (Ward variance minimization)
        Z = linkage(X, method='ward')
        
        # Format the linkage matrix for JSON parsing
        # Z structure: [cluster_idx_1, cluster_idx_2, distance, original_sample_count]
        linkage_matrix = []
        for row in Z:
            linkage_matrix.append({
                "cluster_1": float(row[0]),
                "cluster_2": float(row[1]),
                "distance": float(row[2]),
                "sample_count": float(row[3])
            })
            
        return {
            "linkage_matrix": linkage_matrix
        }
