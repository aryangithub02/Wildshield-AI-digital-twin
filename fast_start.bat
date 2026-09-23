@echo off
title WildShield AI - Instant Web & AI Launcher
color 0A

echo ================================================================
echo       WILDSHIELD AI - INSTANT FAST LAUNCHER (< 2 SECONDS)
echo ================================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: 1. Launch FastAPI Backend Server
echo [1/2] Starting FastAPI Backend on port 8000...
start "WildShield AI - Backend (Port 8000)" cmd /k python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload

:: 2. Launch Vite directly using Node (bypasses slow npm CLI overhead)
echo [2/2] Starting Web Dashboard Frontend (Vite Instant Mode)...
start "WildShield AI - Web Dashboard (Port 5173)" cmd /k node node_modules\vite\bin\vite.js

echo.
echo ================================================================
echo  Servers launched instantly!
echo   - Web Dashboard:     http://localhost:5173
echo   - Backend API:       http://localhost:8000
echo   - Live Camera Stream: http://localhost:8000/api/camera/stream
echo ================================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173
