#!/bin/bash

# Face Recognition Attendance System - MediaPipe Deployment Script
# This script prepares the project for deployment with MediaPipe-only face detection

echo "🚀 Preparing Face Recognition System for MediaPipe Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️ Building frontend for static deployment..."
npm run build

echo "🐍 Setting up backend with MediaPipe dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install MediaPipe-optimized dependencies
echo "📦 Installing MediaPipe-optimized dependencies..."
pip install --upgrade pip
pip install -r requirements-mediapipe.txt

echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Use the render.yaml configuration file"
echo "4. Set environment variables in Render dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - FRONTEND_URL (after frontend is deployed)"
echo "   - Firebase config variables for frontend"
echo ""
echo "🎯 Your app will run with MediaPipe face detection - deployment friendly!"
