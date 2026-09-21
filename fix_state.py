import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# 1. Remove from AiInsightBlock
lines_to_remove = [
    "  const [inferenceForm, setInferenceForm] = useState<Record<string, any>>({});",
    "  const [inferenceResult, setInferenceResult] = useState<any>(null);",
    "  const [inferenceLoading, setInferenceLoading] = useState(false);",
    "  const [selectedInferenceModel, setSelectedInferenceModel] = useState<string>('');"
]
for line in lines_to_remove:
    text = text.replace(line + "\n", "")

# 2. Add to App component and add handleInferenceSubmit
app_start = text.find("function App() {")
if app_start != -1:
    insert_pos = text.find("{", app_start) + 1
    
    handle_func = """
  const handleInferenceSubmit = async () => {
    if (!selectedInferenceModel) return;
    setInferenceLoading(true);
    setInferenceResult(null);
    try {
      const res = await axios.post(`http://localhost:8000/api/jobs/${jobId}/predict`, {
        model_name: selectedInferenceModel,
        features: inferenceForm
      });
      setInferenceResult(res.data);
    } catch (e: any) {
      alert("Inference failed: " + (e.response?.data?.error || e.message));
    } finally {
      setInferenceLoading(false);
    }
  };
"""
    
    text = text[:insert_pos] + "\n" + "\n".join(lines_to_remove) + "\n" + handle_func + text[insert_pos:]

# 3. Update activeTab type
text = text.replace(
    "const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning'>('eda');",
    "const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning' | 'inference'>('eda');"
)

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

