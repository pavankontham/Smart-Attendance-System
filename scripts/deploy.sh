#!/bin/bash

# Face Recognition Attendance System - Deployment Helper Script
# This script helps prepare your project for Render deployment

echo "🚀 Face Recognition Attendance System - Deployment Helper"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check if git is initialized and has remote
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized"
    echo "Please run: git init && git remote add origin <your-repo-url>"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "Commit your changes before deployment:"
    echo "git add ."
    echo "git commit -m 'Prepare for deployment'"
    echo "git push origin main"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Git repository status checked"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Error: Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python --version 2>/dev/null || python3 --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Python version: $PYTHON_VERSION"
else
    echo "❌ Error: Python not found. Please install Python 3.8+"
    exit 1
fi

# Test frontend build
echo ""
echo "🔨 Testing frontend build..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Frontend build failed"
    exit 1
fi

npm run export
if [ $? -ne 0 ]; then
    echo "❌ Error: Frontend export failed"
    exit 1
fi

echo "✅ Frontend build successful"

# Test backend dependencies
echo ""
echo "🔨 Testing backend dependencies..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv || python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Error: Backend dependency installation failed"
    exit 1
fi

echo "✅ Backend dependencies installed successfully"

cd ..

# Check environment files
echo ""
echo "🔍 Checking environment configuration..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "Make sure to set environment variables in Render dashboard"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "Make sure to set environment variables in Render dashboard"
fi

# Display deployment URLs template
echo ""
echo "📋 Deployment Information"
echo "========================"
echo ""
echo "After deploying to Render, update these URLs:"
echo ""
echo "Frontend Service Name: face-recognition-frontend"
echo "Backend Service Name: face-recognition-backend"
echo ""
echo "Expected URLs:"
echo "Frontend: https://face-recognition-frontend.onrender.com"
echo "Backend: https://face-recognition-backend.onrender.com"
echo "API Docs: https://face-recognition-backend.onrender.com/docs"
echo ""

# Display environment variables needed
echo "🔑 Environment Variables Needed"
echo "==============================="
echo ""
echo "Backend Environment Variables:"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- FRONTEND_URL (set after frontend deployment)"
echo ""
echo "Frontend Environment Variables:"
echo "- NEXT_PUBLIC_FIREBASE_API_KEY"
echo "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "- NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "- NEXT_PUBLIC_FIREBASE_APP_ID"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- NEXT_PUBLIC_API_URL (set to backend URL)"
echo ""

echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub if not already done"
echo "2. Create backend service on Render first"
echo "3. Set backend environment variables"
echo "4. Wait for backend to deploy successfully"
echo "5. Create frontend service on Render"
echo "6. Set frontend environment variables (including backend URL)"
echo "7. Update Firebase Auth domains and Supabase CORS settings"
echo ""
echo "📖 See DEPLOYMENT_CHECKLIST.md for detailed instructions"
