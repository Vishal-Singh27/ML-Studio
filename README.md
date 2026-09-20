# ML Studio — Data Pipeline Engine

A full-stack distributed ML platform built with **Node.js, React, FastAPI, BullMQ, Redis, and MongoDB**.  
Upload any CSV dataset and watch the entire machine learning pipeline execute automatically in the background.

**Author:** Vishal Singh | Reg. No. 25225028

---

## Architecture

```
React (Port 5173)
    ↓ POST /api/upload
Node.js Orchestrator (Port 5001)
    ↓ BullMQ → Redis Queue
Worker → FastAPI ML Engine (Port 8000)
    ↓ Webhook on completion
MongoDB ← JobResult stored
    ↑ GET /api/jobs/:id (polled by React)
```

## Pipeline Phases

| Phase | Description |
|-------|-------------|
| **Phase 1** | Automated EDA & Preprocessing (ydata-profiling, scikit-learn) |
| **Phase 2** | Supervised Ensemble (GridSearchCV → LR, NB, RF, GB, Voting, Stacking) |
| **Phase 3** | Unsupervised (PCA + K-Means Silhouette + Hierarchical Clustering) |
| **Phase 4** | Deep Learning MLP (TensorFlow/Keras, Early Stopping) |
| **Phase 5** | React Recharts Dashboard (ROC curves, PCA scatter, accuracy bars) |

## Sample Datasets

Three sample datasets are included in `sample_datasets/` for testing:

| File | Target | Description |
|------|--------|-------------|
| `diabetes_test.csv` | `diabetes` | 800-row diabetes classification |
| `heart_disease_test.csv` | `heart_disease` | 800-row cardiac risk classification |
| `customer_churn_test.csv` | `churn` | 800-row customer churn prediction |

## Running Locally

```bash
docker compose up -d --build
```

Open [http://localhost:5173](http://localhost:5173)

## Services

| Service | Port | Stack |
|---------|------|-------|
| Client | 5173 | React + Vite + Tailwind v4 |
| Server | 5001 | Node.js + Express + BullMQ |
| ML Engine | 8000 | FastAPI + scikit-learn + TensorFlow |
| Redis | 6379 | Job Queue |
| MongoDB | 27017 | Result Storage |
