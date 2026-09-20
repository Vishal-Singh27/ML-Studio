import express from 'express';
import cors from 'cors';
import { Queue } from 'bullmq';
import multer from 'multer';
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

// Endpoint for the React client to upload a dataset
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
        const { job_id, status, task_type, preprocessing, supervised_results, unsupervised_results, dl_results } = req.body;
        
        console.log(`[Webhook Received] Job ${job_id} finished with status: ${status}`);
        
        await JobResult.findOneAndUpdate(
            { job_id },
            { 
                job_id, 
                status, 
                task_type, 
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
