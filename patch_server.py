with open("server/src/app.ts", "r") as f:
    content = f.read()

content = content.replace(
    '"overall": "2-3 sentences summarizing the overall outcome (dataset size, best model/clusters, main takeaway).",',
    '"overall": "2-3 sentences summarizing the overall outcome (dataset size, best model/clusters, main takeaway).",\n  "eda": "1-2 short paragraphs analyzing the EDA: missing values, skewness, strong correlations, outlier counts, and PCA variance. (Always provided).",'
)

with open("server/src/app.ts", "w") as f:
    f.write(content)
print("Updated server")
