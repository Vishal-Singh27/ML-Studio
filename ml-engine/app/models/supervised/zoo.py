from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.base import clone
import joblib
import numpy as np

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
        
    def tune_models(self, X_train, y_train, preprocessor=None):
        """
        Tunes all base models using GridSearchCV.
        If a preprocessor is provided, the model is wrapped in an sklearn Pipeline
        so preprocessing is fit correctly within each CV fold to prevent data leakage.
        """
        if X_train.shape[0] > 2000:
            np.random.seed(42)
            indices = np.random.choice(X_train.shape[0], 2000, replace=False)
            if hasattr(X_train, 'iloc'):
                X_train_sub = X_train.iloc[indices]
            else:
                X_train_sub = X_train[indices]
            y_train_sub = y_train.iloc[indices] if hasattr(y_train, 'iloc') else y_train[indices]
        else:
            X_train_sub = X_train
            y_train_sub = y_train

        self.cv_results_ = {}
        self.best_params_ = {}

        for name, config in self.param_grids.items():
            if preprocessor is not None:
                pipe = Pipeline([
                    ('preprocessor', clone(preprocessor)),
                    ('model', config["model"])
                ])
                params = {f"model__{k}": v for k, v in config["params"].items()}
            else:
                pipe = config["model"]
                params = config["params"]

            grid = GridSearchCV(
                estimator=pipe,
                param_grid=params,
                cv=2,
                scoring="accuracy",
                n_jobs=1
            )
            grid.fit(X_train_sub, y_train_sub)
            self.best_estimators_[name] = grid.best_estimator_
            self.best_params_[name] = grid.best_params_
            
            best_idx = grid.best_index_
            self.cv_results_[name] = {
                "mean_test_score": float(grid.cv_results_['mean_test_score'][best_idx]),
                "std_test_score": float(grid.cv_results_['std_test_score'][best_idx])
            }

        return self.best_estimators_
        
    def build_ensemble(self, X_train, y_train):
        """
        Builds Voting and Stacking classifiers using the tuned pipeline estimators.
        """
        if X_train.shape[0] > 5000:
            np.random.seed(42)
            indices = np.random.choice(X_train.shape[0], 5000, replace=False)
            if hasattr(X_train, 'iloc'):
                X_train_sub = X_train.iloc[indices]
            else:
                X_train_sub = X_train[indices]
            y_train_sub = y_train.iloc[indices] if hasattr(y_train, 'iloc') else y_train[indices]
        else:
            X_train_sub = X_train
            y_train_sub = y_train
            
        estimators = [
            ("lr", self.best_estimators_["logistic_regression"]),
            ("rf", self.best_estimators_["random_forest"]),
            ("gb", self.best_estimators_["gradient_boosting"])
        ]
        
        voting_clf = VotingClassifier(estimators=estimators, voting='soft', n_jobs=1)
        voting_clf.fit(X_train_sub, y_train_sub)
        self.best_estimators_["voting_ensemble"] = voting_clf
        
        stacking_clf = StackingClassifier(estimators=estimators, final_estimator=LogisticRegression(), n_jobs=1)
        stacking_clf.fit(X_train_sub, y_train_sub)
        self.best_estimators_["stacking_ensemble"] = stacking_clf
        
        return self.best_estimators_

    def save_models(self, path_prefix: str):
        paths = {}
        for name, model in self.best_estimators_.items():
            path = f"{path_prefix}_{name}.joblib"
            joblib.dump(model, path)
            paths[name] = path
        return paths
