with open("ml-engine/app/pipelines/preprocessing.py", "r") as f:
    content = f.read()

content = content.replace(
    "if target_column in feature_cols := df_clean.columns.tolist():\n        feature_cols.remove(target_column)",
    "feature_cols = df_clean.columns.tolist()\n    if target_column in feature_cols:\n        feature_cols.remove(target_column)"
)

with open("ml-engine/app/pipelines/preprocessing.py", "w") as f:
    f.write(content)
