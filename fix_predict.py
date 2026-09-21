import re

with open('ml-engine/app/main.py', 'r') as f:
    text = f.read()

# Replace the specific block in predict_single
old_block = """        # Transform features
        X_processed = preprocessor.transform(df)
        
        # Predict
        pred = model.predict(X_processed)[0]
        
        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(X_processed)[0].tolist()
            except Exception:
                pass"""

new_block = """        # Predict (model is now a Pipeline for Supervised tasks!)
        pred = model.predict(df)[0]
        
        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = model.predict_proba(df)[0].tolist()
            except Exception:
                pass"""

text = text.replace(old_block, new_block)

with open('ml-engine/app/main.py', 'w') as f:
    f.write(text)

