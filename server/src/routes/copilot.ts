import express from 'express';
import Groq from 'groq-sdk';
import JobResult from '../models/JobResult';
import { Queue } from 'bullmq';

const router = express.Router();
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const jobQueue = new Queue('ml-jobs', { connection: { url: REDIS_URL } });

router.post('/chat', async (req, res) => {
    try {
        const { job_id, messages } = req.body;
        
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
        }
        
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        // Fetch context
        const job = await JobResult.findOne({ job_id });
        let contextText = "No job context found.";
        let datasetPath = "";
        let targetColumn = "";
        let enableDl = false;
        
        if (job) {
            // Extract from preprocessing dict if possible
            // But we don't save datasetPath in JobResult!
            // Wait, we can get datasetPath from the client, or store it in JobResult.
            contextText = `Current Dataset Context:
Task: ${job.task_type}
Audit Issues: ${JSON.stringify(job.audit?.issues || [])}
Pre-processing used: ${JSON.stringify(job.preprocessing?.summary || {})}
Models trained: ${job.supervised_results ? Object.keys(job.supervised_results.evaluations || {}).join(", ") : "None"}`;
        }

        const systemMessage = {
            role: "system",
            content: `You are the Pipeline Copilot, an advanced ML agent. You act as both a helpful chatbot and an autonomous operator. 
You are currently helping the user with their dataset and ML pipeline.
${contextText}

When the user asks you to modify the pipeline (e.g., 'drop income column', 'use IQR for outliers', 'scale using minmax'), use the 'retrain_pipeline' tool. 
If they just ask a question, answer it concisely.
`
        };

        const tools = [
            {
                type: "function",
                function: {
                    name: "retrain_pipeline",
                    description: "Modifies the pipeline preprocessing settings and triggers a full retrain of the models. Use this to act on user requests like 'drop outliers', 'use minmax scaling', or 'drop columns'.",
                    parameters: {
                        type: "object",
                        properties: {
                            outlier_method: { type: "string", enum: ["zscore", "iqr", "none"], description: "Method to handle outliers" },
                            drop_columns: { type: "array", items: { type: "string" }, description: "Exact names of columns to drop" },
                            num_imputation: { type: "string", enum: ["mean", "median"], description: "Imputation strategy for numerical missing values" },
                            scaling: { type: "string", enum: ["standard", "minmax"], description: "Scaling strategy for numerical features" }
                        },
                        required: ["outlier_method", "drop_columns", "num_imputation", "scaling"]
                    }
                }
            }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: [systemMessage, ...messages],
            model: 'openai/gpt-oss-120b', // or llama3-70b-8192
            tools: tools,
            tool_choice: "auto",
        });

        const responseMessage = chatCompletion.choices[0].message;
        
        // Check if tool was called
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0];
            const args = JSON.parse(toolCall.function.arguments);
            
            // We need dataset_path and target_column to retrain!
            // The client MUST send dataset_path and target_column in req.body for copilot
            const { dataset_path, target_column, enable_dl } = req.body;
            
            if (!dataset_path) {
                return res.json({ 
                    message: { role: "assistant", content: "I cannot retrain the pipeline because the dataset path was not provided by the client UI." } 
                });
            }
            
            // Queue the new job
            const newJobId = Date.now().toString();
            await jobQueue.add('train-ml', {
                job_id: newJobId,
                dataset_path,
                target_column: target_column || null,
                enable_dl: enable_dl || false,
                preprocessing_config: args
            });
            
            // Save initial status
            await JobResult.create({
                job_id: newJobId,
                status: 'processing',
                task_type: 'PENDING'
            });
            
            // Return to chat
            const reply = `I have updated the pipeline configuration and kicked off a new training run (Job #${newJobId})! 

**New Settings Applied:**
- Outliers: ${args.outlier_method}
- Dropped Columns: ${args.drop_columns.length > 0 ? args.drop_columns.join(', ') : 'None'}
- Imputation: ${args.num_imputation}
- Scaling: ${args.scaling}

Wait a few moments and click on the new job ID in the dashboard.`;

            return res.json({
                message: { role: "assistant", content: reply },
                new_job_id: newJobId
            });
        }

        // Just normal text response
        res.json({ message: responseMessage });

    } catch (error: any) {
        console.error("Copilot Error:", error);
        res.status(500).json({ error: "Failed to communicate with Copilot" });
    }
});

export default router;
