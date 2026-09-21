import re

with open('ml-engine/app/main.py', 'r') as f:
    text = f.read()

# In main.py, we have:
#         X_processed = preprocessor.transform(X_new)
#         model_path = f"/tmp/{job_id}_{request.model_name}.joblib"
#         model = joblib.load(model_path)
#         prediction = model.predict(X_processed)

# Change it so it just predicts on X_new (since model is a pipeline)

replacement = """        model_path = f"/tmp/{job_id}_{request.model_name}.joblib"
        model = joblib.load(model_path)
        
        # Supervised models are now saved as full Pipelines! No manual preprocessor needed.
        prediction = model.predict(X_new)"""

text = re.sub(
        r"X_processed = preprocessor\.transform\(X_new\)\s*model_path = f\"/tmp/\{job_id\}_\{request\.model_name\}\.joblib\"\s*model = joblib\.load\(model_path\)\s*prediction = model\.predict\(X_processed\)",
        replacement,
        text
    )

with open('ml-engine/app/main.py', 'w') as f:
    f.write(text)

