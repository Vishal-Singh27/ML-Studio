#!/bin/bash
set -e

# Start Redis in the background
echo "Starting Redis..."
redis-server --daemonize yes

# Wait for Redis to be ready
sleep 2

# Start Python ML Engine in the background
echo "Starting ML Engine..."
cd /app/ml-engine
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start Node API in the background
echo "Starting Node Server..."
cd /app/server
npm run start &

# Wait for internal services to boot
sleep 3

# Start Nginx in the foreground to keep the container alive and route port 7860
echo "Starting Nginx on port 7860..."
nginx -g "daemon off;"
