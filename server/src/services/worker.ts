import { Worker } from 'bullmq';
import axios from 'axios';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://ml-engine:8000';

// Note: Using 'server:5000' here because the Docker internal network routes it properly
const WEBHOOK_URL = 'http://server:5000/api/webhook/ml-engine';

export const worker = new Worker('ml-jobs', async (job) => {
    const { dataset_path, target_column, enable_dl, preprocessing_config } = job.data;
    
    console.log(`[Worker] Processing Job ${job.id}. Sending to ML Engine...`);
    
    try {
        // Send a POST request to the FastAPI Engine
        const response = await axios.post(`${FASTAPI_URL}/train`, {
            job_id: job.id,
            dataset_path: dataset_path,
            target_column: target_column,
            enable_dl: enable_dl,
            webhook_url: WEBHOOK_URL,
            preprocessing_config
        });
        
        console.log(`[Worker] ML Engine acknowledged job ${job.id}:`, response.data.status);
    } catch (error: any) {
        console.error(`[Worker] Failed to trigger ML Engine for job ${job.id}:`, error.message);
        throw error;
    }
}, { 
    connection: { url: REDIS_URL } 
});

worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} successfully dispatched to ML Engine.`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed to dispatch:`, err.message);
});
