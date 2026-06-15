@echo off
title CRM Platform v4.0

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%crm-server"
set "FRONTEND_DIR=%PROJECT_DIR%original-crm\crm-frontend"
set "PORTAL_DIR=%PROJECT_DIR%member-portal"

echo.
echo ============================================
echo   CRM Enterprise Sales Platform v4.0
echo ============================================
echo.

REM 1. Find Node.js
echo [1/4] Checking Node.js...
set "NODE=node"
where node >nul 2>&1
if %errorlevel% neq 0 (
    set "NODE=%PROJECT_DIR%..\.workbuddy\binaries\node\versions\22.22.2\node.exe"
    if not exist "%NODE%" (
        echo [ERROR] Node.js not found
        pause
        exit /b 1
    )
)
echo    Node.js: %NODE%

REM 2. Kill old processes
echo [2/4] Cleaning ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003"') do taskkill /f /pid %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Ports cleared

REM 3. Start Backend
echo [3/4] Starting Backend API (port 8081)...
start "CRM-Backend" cmd /c "cd /d %BACKEND_DIR% && %NODE% src\server.js"
timeout /t 6 /nobreak >nul

REM 4. Start Frontends
echo [4/4] Starting Frontend...
start "CRM-Admin" cmd /c "cd /d %FRONTEND_DIR% && npx vite --port 3002 --host 0.0.0.0"
start "Member-Portal" cmd /c "cd /d %PORTAL_DIR% && npx vite --port 3003 --host 0.0.0.0"
timeout /t 4 /nobreak >nul

REM 5. Show URLs
echo.
echo ============================================
echo   All services started!
echo.
echo   CRM Admin:     http://localhost:3002
echo   Member Portal: http://localhost:3003
echo   Backend API:   http://localhost:8081
echo.
echo   Login: admin / admin123
echo   Member: 13800000000 / 123456
echo ============================================
echo.
pause
