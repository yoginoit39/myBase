#!/bin/bash
echo "Starting MyBase..."

# Start backend
cd backend
venv/bin/uvicorn app.main:app --reload --port 8003 &
BACKEND_PID=$!
echo "Backend running on http://localhost:8003 (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm start -- --port 4200 &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:4200 (PID: $FRONTEND_PID)"

echo ""
echo "MyBase is running!"
echo "  Dashboard:  http://localhost:4200"
echo "  API Docs:   http://localhost:8003/docs"
echo ""
echo "Press Ctrl+C to stop"

wait
