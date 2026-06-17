@echo off
title CRM App APK Builder
chcp 936 >nul

echo ============================================
echo   CRM Member App — APK Build Tool
echo ============================================
echo.

:: Step 1: Build web app
echo [1/3] Building Vue web app...
call npx vite build
if %ERRORLEVEL% neq 0 (
  echo ERROR: Build failed!
  pause
  exit /b 1
)
echo        Build OK ✓

:: Step 2: Sync to Android
echo.
echo [2/3] Syncing to Android project...
call npx cap sync
if %ERRORLEVEL% neq 0 (
  echo ERROR: Sync failed!
  pause
  exit /b 1
)
echo        Sync OK ✓

:: Step 3: Build APK
echo.
echo [3/3] Building APK...
echo.
echo You have two options:
echo   A) Open in Android Studio:  cd android ^&^& start .
echo   B) Build from command line (requires Android SDK):
echo.

:: Try to detect Android Studio
set ANDROID_STUDIO=
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" set ANDROID_STUDIO=C:\Program Files\Android\Android Studio\bin\studio64.exe
if exist "%LOCALAPPDATA%\Android\Sdk" echo        Android SDK found ✓
if exist "%ANDROID_STUDIO%" (
  echo        Android Studio found ✓
  echo.
  echo Opening Android Studio...
  start "" "%ANDROID_STUDIO%" "%cd%\android"
) else (
  echo.
  echo Android Studio not found. To build the APK:
  echo   1. Install Android Studio from https://developer.android.com/studio
  echo   2. Open this folder in Android Studio: %cd%\android
  echo   3. Click Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
)

echo.
echo ============================================
echo   Build complete!
echo.
echo   Web app (PWA): %cd%\dist
echo   Android project: %cd%\android
echo.
echo   To install as PWA: Open https://your-url in Chrome and tap "Add to Home Screen"
echo ============================================
pause
