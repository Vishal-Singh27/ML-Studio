with open("server/src/app.ts", "r") as f:
    content = f.read()

predict_route = """
app.post('/api/jobs/:id/predict', async (req, res) => {
    try {
        const job_id = req.params.id;
        const { model_name, features } = req.body;
        
        const payload = {
            job_id,
            model_name,
            features
        };
        
        const mlResponse = await axios.post('http://ml-engine:8000/predict', payload);
        res.json(mlResponse.data);
    } catch (error: any) {
        console.error("Prediction error:", error?.response?.data || error.message);
        res.status(500).json({ error: error?.response?.data?.detail || "Prediction failed" });
    }
});
"""

if "app.post('/api/jobs/:id/predict'" not in content:
    # Insert before the end or after insights/followup
    if "app.post('/api/insights/followup'" in content:
        content = content.replace("app.post('/api/insights/followup', async (req, res) => {", predict_route + "\napp.post('/api/insights/followup', async (req, res) => {")
    else:
        content += predict_route
        
    with open("server/src/app.ts", "w") as f:
        f.write(content)
    print("Updated server/src/app.ts")
else:
    print("Predict route already exists in server/src/app.ts")
