#!/bin/bash

# Frontend build script for Render deployment
echo "Starting frontend build..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

echo "Build completed successfully!"
