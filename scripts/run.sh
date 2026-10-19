#!/usr/bin/env bash

echo "=========================================================="
echo "  Starting CausalOpsDB-X Application"
echo "=========================================================="

if [ -d "venv" ]; then
    source venv/bin/activate
fi

export PYTHONPATH=$(pwd)

echo -e "\nStarting Backend on http://localhost:8000 ..."
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo -e "Starting Frontend on http://localhost:3000 ..."
cd frontend
npm run start &
FRONTEND_PID=$!
cd ..

sleep 3

echo -e "\n=========================================================="
echo "  CausalOpsDB-X is Live & Operational!"
echo "  -> Frontend Workstation: http://localhost:3000"
echo "  -> Backend API Docs:     http://localhost:8000/docs"
echo "  -> API Health:           http://localhost:8000/api/health"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM
wait
