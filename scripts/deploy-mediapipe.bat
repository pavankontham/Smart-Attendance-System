@echo off
REM Face Recognition Attendance System - MediaPipe Deployment Script (Windows)
REM This script prepares the project for deployment with MediaPipe-only face detection

echo 🚀 Preparing Face Recognition System for MediaPipe Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: Backend directory not found
    pause
    exit /b 1
)

echo 📦 Installing frontend dependencies...
call npm install

echo 🏗️ Building frontend for static deployment...
call npm run build

echo 🐍 Setting up backend with MediaPipe dependencies...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🔧 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install MediaPipe-optimized dependencies
echo 📦 Installing MediaPipe-optimized dependencies...
python -m pip install --upgrade pip
pip install -r requirements-mediapipe.txt

echo ✅ Deployment preparation complete!
echo.
echo 📋 Next steps for Render deployment:
echo 1. Push your code to GitHub
echo 2. Connect your GitHub repo to Render
echo 3. Use the render.yaml configuration file
echo 4. Set environment variables in Render dashboard:
echo    - SUPABASE_URL
echo    - SUPABASE_SERVICE_ROLE_KEY
echo    - FRONTEND_URL (after frontend is deployed)
echo    - Firebase config variables for frontend
echo.
echo 🎯 Your app will run with MediaPipe face detection - deployment friendly!
pause
