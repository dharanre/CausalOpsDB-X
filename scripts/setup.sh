#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  CausalOpsDB-X Native Unix/Linux/macOS Setup"
echo "  Evidence-Grounded Infrastructure Change Intelligence"
echo "=========================================================="

echo -e "\n[1/5] Verifying Prerequisites (Python & Node.js)..."
python3 --version
node --version
npm --version

echo -e "\n[2/5] Setting up Virtual Environment & Dependencies..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r backend/requirements.txt --quiet

echo -e "\n[3/5] Initializing Local Data Directories..."
mkdir -p data/cache data/raw data/processed data/fixtures

echo -e "\n[4/5] Bootstrapping RCAEval Public Benchmark Data (Quickstart Mode)..."
python3 backend/scripts/bootstrap_data.py --mode quickstart

echo -e "\n[5/5] Installing Frontend Dependencies & Building Web App..."
cd frontend
npm install --silent
npm run build
cd ..

echo -e "\n=========================================================="
echo "  Setup Successful!"
echo "  To start the application, run:"
echo "    bash scripts/run.sh"
echo "=========================================================="
