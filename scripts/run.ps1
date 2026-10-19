# CausalOpsDB-X Windows Native Run Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting CausalOpsDB-X Application                       " -ForegroundColor Cyan
Write-Host "  Evidence-Grounded Infrastructure Change Intelligence   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = (Get-Location).Path
$env:PYTHONPATH = $root

# 1. Start Backend Server
Write-Host "`n[1/2] Launching Backend on http://localhost:8000 ..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload" -PassThru -NoNewWindow

# 2. Start Frontend Server
Write-Host "[2/2] Launching Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm --prefix frontend run dev" -PassThru -NoNewWindow

Start-Sleep -Seconds 4

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  CausalOpsDB-X is Live & Operational!                    " -ForegroundColor Green
Write-Host "  -> Frontend Workstation: http://localhost:3000         " -ForegroundColor Cyan
Write-Host "  -> Backend API Docs:     http://localhost:8000/docs    " -ForegroundColor Cyan
Write-Host "  -> API Health:           http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Keep this window open. Press Ctrl+C to stop.`n"

# Wait for processes
try {
    Wait-Process -Id $backendProcess.Id, $frontendProcess.Id
} catch {
    Stop-Process -Id $backendProcess.Id, $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}
