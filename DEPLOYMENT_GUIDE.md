# Deployment Guide for Face Recognition Attendance System

## Frontend Deployment on Render

### Option 1: Manual Deployment (Recommended)

1. **Create a new Static Site on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Static Site"
   - Connect your GitHub repository: `https://github.com/pavankontham/Smart-Attendance-System.git`

2. **Configure Build Settings**
   - **Name**: `face-recognition-frontend`
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `out`

3. **Set Environment Variables**
   Add the following environment variables in the Render dashboard:

   ```
   NODE_VERSION=18.17.0
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBzEAIH3c6IKuBDI0zwFnGf_PWOZfS4fNc
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smart-attendance-system-9b54c.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=smart-attendance-system-9b54c
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smart-attendance-system-9b54c.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=366813719018
   NEXT_PUBLIC_FIREBASE_APP_ID=1:366813719018:web:a9e7f5a8a3390b48366a93
   NEXT_PUBLIC_SUPABASE_URL=https://qkrusouqwmrpernncabq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnVzb3Vxd21ycGVybm5jYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDc5NjksImV4cCI6MjA2NDYyMzk2OX0.R_Hw6DsozhjnZGLBoERi1P0Q-6GQFdL_R7MxaPrOplY
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for the build to complete

### Option 2: Using render.yaml (Blueprint)

1. **Use the render.yaml file**
   - The repository includes a `render.yaml` file for frontend deployment
   - Go to Render Dashboard → "New" → "Blueprint"
   - Connect your GitHub repository
   - The environment variables still need to be set manually in the dashboard

## Backend Deployment on Render

1. **Create a new Web Service**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - **Root Directory**: `backend`

2. **Configure Build Settings**
   - **Name**: `face-recognition-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements-mediapipe.txt`
   - **Start Command**: `python main.py`

3. **Set Environment Variables**
   ```
   PYTHON_VERSION=3.9.18
   SUPABASE_URL=https://qkrusouqwmrpernncabq.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnVzb3Vxd21ycGVybm5jYWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0Nzk2OSwiZXhwIjoyMDY0NjIzOTY5fQ.yP8WLKdMDuGZpwrTeU2kYSCUtq6wSG4GsOp4A62CdW0
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

## Important Notes

1. **Update API URL**: After backend deployment, update the `NEXT_PUBLIC_API_URL` in frontend environment variables
2. **Update Frontend URL**: After frontend deployment, update the `FRONTEND_URL` in backend environment variables
3. **CORS Configuration**: The backend is configured to allow requests from the frontend URL
4. **Build Issues**: If build fails, check that all environment variables are set correctly

## Troubleshooting

### Frontend Build Fails
- Ensure all `NEXT_PUBLIC_*` environment variables are set
- Check that Node.js version is 18.x
- Verify the build command is correct: `npm install && npm run build`

### Backend Build Fails
- Ensure Python version is 3.9.x
- Check that requirements-mediapipe.txt exists in backend directory
- Verify Supabase environment variables are set

### Module Resolution Issues
- The project uses absolute imports with path mapping
- jsconfig.json is configured for proper module resolution
- All imports should work correctly with the current setup
