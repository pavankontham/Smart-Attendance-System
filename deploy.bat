@echo off
REM Face Recognition Attendance System - Deployment Helper Script (Windows)
REM This script helps prepare your project for Render deployment

echo 🚀 Face Recognition Attendance System - Deployment Helper
echo ==========================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Error: Git repository not initialized
    echo Please run: git init && git remote add origin ^<your-repo-url^>
    pause
    exit /b 1
)

echo ✅ Git repository found

REM Check Node.js version
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
    node --version
)

REM Check Python version
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python not found. Please install Python 3.8+
    pause
    exit /b 1
) else (
    echo ✅ Python found
    python --version
)

REM Test frontend build
echo.
echo 🔨 Testing frontend build...
call npm install
if errorlevel 1 (
    echo ❌ Error: npm install failed
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ❌ Error: Frontend build failed
    pause
    exit /b 1
)

REM Next.js 14 uses output: 'export' in config, no separate export command needed
echo ✅ Frontend static export configured in next.config.js

echo ✅ Frontend build successful

REM Test backend dependencies
echo.
echo 🔨 Testing backend dependencies...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Error: Failed to create virtual environment
        cd ..
        pause
        exit /b 1
    )
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Error: Backend dependency installation failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed successfully
cd ..

REM Check environment files
echo.
echo 🔍 Checking environment configuration...

if not exist ".env.local" (
    echo ⚠️  Warning: .env.local not found
    echo Make sure to set environment variables in Render dashboard
)

if not exist "backend\.env" (
    echo ⚠️  Warning: backend\.env not found
    echo Make sure to set environment variables in Render dashboard
)

REM Display deployment information
echo.
echo 📋 Deployment Information
echo ========================
echo.
echo After deploying to Render, update these URLs:
echo.
echo Frontend Service Name: face-recognition-frontend
echo Backend Service Name: face-recognition-backend
echo.
echo Expected URLs:
echo Frontend: https://face-recognition-frontend.onrender.com
echo Backend: https://face-recognition-backend.onrender.com
echo API Docs: https://face-recognition-backend.onrender.com/docs
echo.

REM Display environment variables needed
echo 🔑 Environment Variables Needed
echo ===============================
echo.
echo Backend Environment Variables:
echo - SUPABASE_URL
echo - SUPABASE_SERVICE_ROLE_KEY
echo - FRONTEND_URL (set after frontend deployment)
echo.
echo Frontend Environment Variables:
echo - NEXT_PUBLIC_FIREBASE_API_KEY
echo - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
echo - NEXT_PUBLIC_FIREBASE_PROJECT_ID
echo - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
echo - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
echo - NEXT_PUBLIC_FIREBASE_APP_ID
echo - NEXT_PUBLIC_SUPABASE_URL
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo - NEXT_PUBLIC_API_URL (set to backend URL)
echo.

echo ✅ Deployment preparation complete!
echo.
echo Next steps:
echo 1. Push your code to GitHub if not already done
echo 2. Create backend service on Render first
echo 3. Set backend environment variables
echo 4. Wait for backend to deploy successfully
echo 5. Create frontend service on Render
echo 6. Set frontend environment variables (including backend URL)
echo 7. Update Firebase Auth domains and Supabase CORS settings
echo.
echo 📖 See DEPLOYMENT_CHECKLIST.md for detailed instructions

pause
