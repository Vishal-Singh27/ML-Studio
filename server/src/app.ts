import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { Queue } from 'bullmq';
import multer from 'multer';
import copilotRouter from './routes/copilot';
import path from 'path';
import fs from 'fs';
import './services/worker'; // Start the worker automatically

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Setup Multer to store uploaded datasets in the container's /tmp/uploads directory
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const jobQueue = new Queue('ml-jobs', { connection: { url: REDIS_URL } });

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'server' });
});

// Expose the uploads directory statically so FastAPI can download the CSV
app.use('/uploads', express.static(uploadDir));
app.use('/api/copilot', copilotRouter);

// Endpoint for the React client to upload a dataset


app.post('/api/audit', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 1. Call ML Engine /audit endpoint
    const mlEngineAuditUrl = 'http://ml-engine:8000/audit';
    const auditResponse = await axios.post(mlEngineAuditUrl, {
      dataset_path: req.file.path,
      target_column: req.body.target_column || null
    });
    
    const issues = auditResponse.data.issues || [];
    
    // 2. Generate LLM Explanation
    let llmExplanation = "";
    if (issues.length > 0 && process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const prompt = `You are the Data Doctor, a senior ML architect. Review these dataset audit flags and give a concise, actionable, and friendly summary to the user about what is wrong with their dataset. DO NOT include markdown code blocks. Keep it under 4 paragraphs.

Issues found:
${JSON.stringify(issues, null, 2)}`;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
      });
      llmExplanation = completion.choices[0]?.message?.content || "";
    } else if (issues.length === 0) {
      llmExplanation = "Your dataset looks perfectly clean! No major leakage or class imbalances detected. You're ready to train.";
    }
    
    res.json({
      status: 'success',
      issues,
      explanation: llmExplanation,
      file_path: req.file.path // Returning this so we can reuse it for training
    });
    
  } catch (error: any) {
    console.error('Audit Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('dataset'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const target = req.body.target || null;
        const enable_dl = req.body.enable_dl === 'true';
        
        // Mimic a Cloud Storage URL (e.g., S3) using the local Docker network
        const storageUrl = `http://server:5000/uploads/${req.file.filename}`;
        
        // Non-Blocking: Push job to BullMQ immediately and return to client
        const job = await jobQueue.add('train-model', { 
            dataset_path: storageUrl, 
            target_column: target,
            enable_dl: enable_dl
        });
        
        res.status(201).json({ 
            jobId: job.id, 
            message: 'Dataset uploaded and ML pipeline queued!',
            path: storageUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to queue job' });
    }
});

import mongoose from 'mongoose';
import JobResult from './models/JobResult';

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/mlstudio';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Webhook endpoint for the Python FastAPI Engine to ping when training is done
app.post('/api/webhook/ml-engine', async (req, res) => {
    try {
        const { job_id, status, task_type, audit, preprocessing, supervised_results, unsupervised_results, dl_results } = req.body;
        
        console.log(`[Webhook Received] Job ${job_id} finished with status: ${status}`);
        if (status === 'error') { console.log('ERROR MESSAGE:', req.body.message); }
        console.log('Webhook Body Keys:', Object.keys(req.body));
        console.log('Audit in body:', JSON.stringify(req.body.audit));
        
        // Data Doctor LLM Pass
        let doctor_explanation = "";
        if (audit && audit.issues && process.env.GROQ_API_KEY) {
            try {
                if (audit.issues.length > 0) {
                    const prompt = `You are the Data Doctor, a senior ML architect. Review these dataset audit flags and give a concise, actionable, and friendly summary to the user about what is wrong with their dataset. DO NOT include markdown code blocks. Keep it under 3 paragraphs.\n\nIssues found:\n${JSON.stringify(audit.issues, null, 2)}`;
                    
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'openai/gpt-oss-120b',
                            messages: [{ role: 'user', content: prompt }]
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        doctor_explanation = data.choices[0]?.message?.content || "";
                    } else {
                        doctor_explanation = "Could not fetch Data Doctor summary.";
                    }
                } else {
                    doctor_explanation = "Your dataset looks perfectly clean! No major leakage or class imbalances detected. Excellent foundation for training.";
                }
                audit.explanation = doctor_explanation;
            } catch (e) {
                console.error("Data Doctor Error", e);
            }
        }
        
        await JobResult.findOneAndUpdate(
            { job_id },
            { 
                job_id, 
                status, 
                task_type, 
                audit,
                preprocessing, 
                supervised_results, 
                unsupervised_results, 
                dl_results 
            },
            { upsert: true, new: true }
        );
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Endpoint for React to fetch job status and results
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job_id = req.params.id;
        
        // First check MongoDB to see if the job is completed and stored
        const result = await JobResult.findOne({ job_id });
        if (result) {
            return res.json({ status: result.status, data: result });
        }
        
        // If not in MongoDB, check BullMQ to see if it's still running
        const job = await jobQueue.getJob(job_id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const state = await job.getState();
        return res.json({ status: state });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
});

// Endpoint for AI Insights using Groq
app.post('/api/insights', async (req, res) => {
    try {
        const { summary } = req.body;
        const apiKey = process.env.GROQ_API_KEY;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'GROQ_API_KEY is not set in the server environment.' });
        }

        const prompt = `You are an expert AI Data Scientist. Analyze the ML pipeline results and output a JSON object containing specific insights for different UI sections.
Return ONLY a valid JSON object matching this exact structure (use markdown for text, use bolding, avoid raw tables, keep it concise and punchy):
{
  "overall": "2-3 sentences summarizing the overall outcome.",
  "eda": "Analysis of the EDA metrics.",
  "leaderboard": "Insight on model comparison.",
  "confusion_matrix": "Insight on classification errors/accuracy.",
  "accuracy_f1": "Insight analyzing the Accuracy vs F1 Score bar chart across models.",
  "roc_curve": "Insight analyzing the ROC Curves and AUC.",
  "feature_importance": "Insight analyzing which features drove the model's decisions most.",
  "precision_recall": "Insight analyzing the Precision & Recall metrics.",
  "cross_validation": "Insight analyzing the Bias-Variance tradeoff from CV scores.",
  "deep_learning": "Insight on DL training curves.",
  "pca": "Insight on PCA projection and cluster separation.",
  "distribution": "Insight on cluster sizes/balance.",
  "silhouette": "Insight on the Silhouette score and optimal K."
}

Pipeline Results:
${JSON.stringify(summary, null, 2)}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${errText}`);
        }

        const data = await response.json();
        const jsonResult = JSON.parse(data.choices[0].message.content);
        res.json({ insights: jsonResult });
    } catch (error: any) {
        console.error('Insights Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate insights' });
    }
});


// Endpoint for AI Follow-up Questions

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

app.post('/api/insights/followup', async (req, res) => {
    try {
        const { section, question, baseInsight } = req.body;
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(400).json({ error: 'GROQ_API_KEY is not set.' });

        const prompt = `You are an expert AI Data Scientist. The user is asking a follow-up question about the "${section}" section of their machine learning results.
Original insight context: "${baseInsight}"

User's question: "${question}"

Answer concisely and clearly as an expert. Keep it under 4 sentences. Use markdown for bolding/lists if helpful.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 500
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        res.json({ answer: data.choices[0].message.content });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to answer follow-up' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
