@echo off
title CRM Platform - Public Mode
echo.
echo ============================================
echo   CRM Platform - Public Deployment
echo ============================================
echo.
echo This script starts the backend and creates
echo a public tunnel so anyone can access it.
echo.
echo Step 1: Start the backend API (port 8081)
echo Step 2: Create a public tunnel URL
echo Step 3: Copy the tunnel URL into the frontend
echo.
echo ============================================
echo.

set "PROJECT_DIR=%~dp0"

echo [1/2] Starting backend...
start "CRM-Backend" cmd /c "cd /d %PROJECT_DIR%crm-server && node src\server.js"
timeout /t 6 /nobreak >nul

echo.
echo [2/2] Creating public tunnel to port 8081...
echo.
echo --- Your public URL will appear below ---
echo.

cd /d %PROJECT_DIR%
npx localtunnel --port 8081

echo.
echo --- After you get the URL above ---
echo 1. Copy the https://xxxxx.loca.lt URL
echo 2. Open both HTML files in dist\ folder
echo 3. Add this script before ^</head^>:
echo    ^<script^>window.__CRM_API_URL__='YOUR_TUNNEL_URL/api'^</script^>
echo 4. Redeploy to CloudStudio
echo.
pause
