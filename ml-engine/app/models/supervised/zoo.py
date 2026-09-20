from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.model_selection import GridSearchCV
import joblib

class SupervisedModelZoo:
    """
    A Model Zoo containing Phase 2 Supervised Models & Ensembles.
    Uses GridSearchCV for tuning to prevent data leakage and finds the best estimator.
    """
    def __init__(self):
        self.param_grids = {
            "logistic_regression": {
                "model": LogisticRegression(max_iter=1000),
                "params": {"C": [0.1, 1.0]}
            },
            "naive_bayes": {
                "model": GaussianNB(),
                "params": {}
            },
            "random_forest": {
                "model": RandomForestClassifier(random_state=42),
                "params": {"n_estimators": [50], "max_depth": [5, 10]}
            },
            "gradient_boosting": {
                "model": GradientBoostingClassifier(random_state=42),
                "params": {"n_estimators": [50], "learning_rate": [0.1]}
            }
        }
        self.best_estimators_ = {}
        
    def tune_models(self, X_train, y_train):
        """
        Tunes all base models using GridSearchCV with minimal param grids.
        n_jobs=1 to avoid Mac Docker multiprocessing deadlock.
        """
        import numpy as np

        # Subsample to max 2000 rows for speed
        if X_train.shape[0] > 2000:
            np.random.seed(42)
            indices = np.random.choice(X_train.shape[0], 2000, replace=False)
            X_train_sub = X_train[indices]
            y_train_sub = y_train.iloc[indices] if hasattr(y_train, 'iloc') else y_train[indices]
        else:
            X_train_sub = X_train
            y_train_sub = y_train

        for name, config in self.param_grids.items():
            grid = GridSearchCV(
                estimator=config["model"],
                param_grid=config["params"],
                cv=2,
                scoring="accuracy",
                n_jobs=1
            )
            grid.fit(X_train_sub, y_train_sub)
            self.best_estimators_[name] = grid.best_estimator_

        return self.best_estimators_
        
    def build_ensemble(self, X_train, y_train):
        """
        Builds Voting and Stacking classifiers using the tuned base estimators.
        """
        import numpy as np
        
        # Subsample if dataset is too large to prevent 10 minute training times
        if X_train.shape[0] > 5000:
            np.random.seed(42)
            indices = np.random.choice(X_train.shape[0], 5000, replace=False)
            X_train_sub = X_train[indices]
            y_train_sub = y_train.iloc[indices] if hasattr(y_train, 'iloc') else y_train[indices]
        else:
            X_train_sub = X_train
            y_train_sub = y_train
            
        # Select a subset of strong, diverse models for the ensembles
        estimators = [
            ("lr", self.best_estimators_["logistic_regression"]),
            ("rf", self.best_estimators_["random_forest"]),
            ("gb", self.best_estimators_["gradient_boosting"])
        ]
        
        # Soft voting uses predicted probabilities
        voting_clf = VotingClassifier(estimators=estimators, voting='soft')
        voting_clf.fit(X_train_sub, y_train_sub)
        self.best_estimators_["voting_ensemble"] = voting_clf
        
        # Stacking uses predictions of base estimators as features for a final meta-estimator
        stacking_clf = StackingClassifier(estimators=estimators, final_estimator=LogisticRegression())
        stacking_clf.fit(X_train_sub, y_train_sub)
        self.best_estimators_["stacking_ensemble"] = stacking_clf
        
        return self.best_estimators_

    def save_models(self, path_prefix: str):
        """
        Saves all tuned and ensemble models to disk.
        """
        paths = {}
        for name, model in self.best_estimators_.items():
            path = f"{path_prefix}_{name}.joblib"
            joblib.dump(model, path)
            paths[name] = path
        return paths
