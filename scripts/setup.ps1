# CausalOpsDB-X Windows Native Setup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CausalOpsDB-X Native Windows Setup                      " -ForegroundColor Cyan
Write-Host "  Evidence-Grounded Infrastructure Change Intelligence   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Prerequisites
Write-Host "`n[1/5] Verifying Prerequisites (Python & Node.js)..." -ForegroundColor Yellow
$pyVersion = python --version 2>&1
$nodeVersion = node --version 2>&1
$npmVersion = npm --version 2>&1

if (-not $pyVersion) {
    Write-Error "Python 3 is required but was not found in PATH."
    exit 1
}
if (-not $nodeVersion) {
    Write-Error "Node.js is required but was not found in PATH."
    exit 1
}

Write-Host "  -> Python: $pyVersion" -ForegroundColor Green
Write-Host "  -> Node.js: $nodeVersion (npm: $npmVersion)" -ForegroundColor Green

# 2. Install Backend Python Dependencies
Write-Host "`n[2/5] Installing Backend Python Dependencies..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Pip install reported warnings or errors. Retrying with user flag..."
    python -m pip install -r backend/requirements.txt --user --quiet
}
Write-Host "  -> Backend dependencies installed." -ForegroundColor Green

# 3. Create Required Data Directories
Write-Host "`n[3/5] Initializing Local Data Directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "data/cache", "data/raw", "data/processed", "data/fixtures" | Out-Null
Write-Host "  -> Local data directories ready." -ForegroundColor Green

# 4. Bootstrap Benchmark Data (Quickstart Mode)
Write-Host "`n[4/5] Bootstrapping RCAEval Public Benchmark Data (Quickstart Mode)..." -ForegroundColor Yellow
python backend/scripts/bootstrap_data.py --mode quickstart
Write-Host "  -> Benchmark bootstrap completed." -ForegroundColor Green

# 5. Install Frontend Dependencies & Build
Write-Host "`n[5/5] Installing Frontend Dependencies & Building Web App..." -ForegroundColor Yellow
Push-Location frontend
npm install --silent
npm run build
Pop-Location
Write-Host "  -> Frontend build complete." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Setup Successful!                                       " -ForegroundColor Green
Write-Host "  To start the application, run:                          " -ForegroundColor White
Write-Host "    .\scripts\run.ps1                                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
