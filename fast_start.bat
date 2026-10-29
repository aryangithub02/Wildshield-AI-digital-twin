@echo off
title WildShield AI - Instant Web & AI Launcher (< 1s)
color 0A

echo ================================================================
echo       WILDSHIELD AI - INSTANT FAST LAUNCHER (< 1 SECOND)
echo ================================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: Clean up any orphaned process on port 8000
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { if ($c.OwningProcess -gt 0) { Write-Host '[INFO] Freeing port 8000 from old PID:' $c.OwningProcess; Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }" 2>nul

:: Use dedicated project .venv if available, fallback to system python
if exist "%PROJECT_DIR%.venv\Scripts\python.exe" (
    set "PYTHON_CMD="%PROJECT_DIR%.venv\Scripts\python.exe""
) else (
    set "PYTHON_CMD=python"
)

:: 1. Launch FastAPI Backend Server
echo [1/2] Starting FastAPI Backend on port 8000 (OBS Cam / YOLOv11 Engine)...
start "WildShield AI - Backend (Port 8000)" cmd /k %PYTHON_CMD% -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload

:: 2. Launch Vite directly using Node (bypasses slow npm CLI overhead)
echo [2/2] Starting Web Dashboard Frontend (Port 5173)...
start "WildShield AI - Web Dashboard (Port 5173)" cmd /k node node_modules\vite\bin\vite.js

echo.
echo ================================================================
echo  Servers launched instantly!
echo   - Web Dashboard:     http://localhost:5173
echo   - Backend API:       http://localhost:8000
echo   - OBS Live Stream:   http://localhost:8000/api/camera/stream
echo ================================================================
echo.
timeout /t 1 /nobreak >nul
start http://localhost:5173
