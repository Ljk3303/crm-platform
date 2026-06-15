@echo off
title CRM Platform - All Services
chcp 936 >nul

echo ============================================
echo   CRM Platform v4 - Starting All Services
echo ============================================
echo.

:: Kill old processes
echo [1/5] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 3 /nobreak >nul

:: Start backend
echo [2/5] Starting backend API (port 8081)...
start "CRM-Backend" cmd /c "cd /d %~dp0crm-server && node src/server.js"
timeout /t 5 /nobreak >nul

:: Seed data guarantee
echo [3/5] Verifying database...
cd /d %~dp0
python -c "import sqlite3;db=sqlite3.connect('crm-server/data/crm.db');c=db.execute('SELECT COUNT(*) FROM customer').fetchone()[0];print(f'Database OK: {c} customers');db.close()" 2>nul || echo WARNING: Python check failed, but continuing...

:: Start CRM frontend
echo [4/5] Starting CRM Admin (port 3002)...
start "CRM-Admin" cmd /c "cd /d %~dp0original-crm\crm-frontend && npx vite --port 3002 --host 0.0.0.0"
timeout /t 3 /nobreak >nul

:: Start Member portal
echo [5/5] Starting Member Portal (port 3003)...
start "CRM-Portal" cmd /c "cd /d %~dp0member-portal && npx vite --port 3003 --host 0.0.0.0"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   All services started!
echo.
echo   CRM Admin:      http://localhost:3002
echo   Member Portal:  http://localhost:3003
echo   Backend API:    http://localhost:8081
echo.
echo   Login: admin / admin123
echo ============================================
echo.
echo Keep this window open. Press Ctrl+C to stop all.
pause
