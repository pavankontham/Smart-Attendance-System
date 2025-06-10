# 🚀 Render Deployment Checklist

## Pre-Deployment Setup

### ✅ Repository Preparation
- [ ] Code is pushed to GitHub
- [ ] `.gitignore` is properly configured
- [ ] Environment files are not committed
- [ ] All dependencies are listed in `requirements.txt` and `package.json`

### ✅ Configuration Files
- [ ] `next.config.js` updated for static export
- [ ] `package.json` includes export scripts
- [ ] `render.yaml` created (optional but recommended)
- [ ] Backend CORS updated for production domains

### ✅ External Services
- [ ] Supabase project is set up and accessible
- [ ] Firebase project is configured
- [ ] Database schema is deployed to Supabase
- [ ] Firebase Auth domains will be updated after deployment

## Backend Deployment (Deploy First)

### ✅ Render Backend Service Setup
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Configure build command: `pip install -r requirements.txt`
- [ ] Configure start command: `python main.py`
- [ ] Set environment to Python 3

### ✅ Backend Environment Variables
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `PYTHON_VERSION` - Set to `3.9.18`
- [ ] `FRONTEND_URL` - Will be set after frontend deployment

### ✅ Backend Testing
- [ ] Service deploys successfully
- [ ] Health check endpoint responds: `/health`
- [ ] API documentation accessible: `/docs`
- [ ] Database connection works
- [ ] Face recognition endpoints respond

## Frontend Deployment (Deploy Second)

### ✅ Render Frontend Service Setup
- [ ] Create new Static Site on Render
- [ ] Connect GitHub repository
- [ ] Set root directory to `/` (root)
- [ ] Configure build command: `npm install && npm run build && npm run export`
- [ ] Set publish directory to `out`

### ✅ Frontend Environment Variables
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_API_URL` - Your backend service URL

### ✅ Frontend Testing
- [ ] Site builds and deploys successfully
- [ ] Static files are served correctly
- [ ] Environment variables are accessible
- [ ] API calls reach the backend
- [ ] Authentication flow works

## Post-Deployment Configuration

### ✅ Update External Services
- [ ] Add frontend domain to Firebase Auth authorized domains
- [ ] Add frontend domain to Supabase CORS settings
- [ ] Update backend `FRONTEND_URL` environment variable
- [ ] Test CORS configuration

### ✅ Security Updates
- [ ] Verify HTTPS is working on both services
- [ ] Test authentication flow end-to-end
- [ ] Verify face recognition API security
- [ ] Check that sensitive data is not exposed

## Final Testing

### ✅ Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Face enrollment works
- [ ] Face recognition works
- [ ] Class management works
- [ ] Attendance marking works
- [ ] Profile management works

### ✅ Performance Testing
- [ ] Page load times are acceptable
- [ ] API response times are reasonable
- [ ] Face recognition processing time is acceptable
- [ ] Image upload and processing works

### ✅ Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if applicable)
- [ ] Mobile browsers

## Monitoring Setup

### ✅ Render Monitoring
- [ ] Set up health checks
- [ ] Configure log monitoring
- [ ] Set up deployment notifications
- [ ] Monitor resource usage

### ✅ Application Monitoring
- [ ] Test error handling
- [ ] Verify logging is working
- [ ] Set up uptime monitoring
- [ ] Monitor API endpoint health

## Troubleshooting Common Issues

### Backend Issues
- **Build fails**: Check Python version and dependencies
- **Port binding**: Ensure using PORT environment variable
- **CORS errors**: Verify allowed origins include frontend domain
- **Database connection**: Check Supabase credentials

### Frontend Issues
- **Build fails**: Check Node.js version and dependencies
- **API calls fail**: Verify NEXT_PUBLIC_API_URL
- **Auth issues**: Check Firebase configuration
- **Static export issues**: Verify next.config.js settings

## Deployment URLs

After successful deployment, update these:

- **Frontend URL**: `https://your-frontend.onrender.com`
- **Backend URL**: `https://your-backend.onrender.com`
- **API Documentation**: `https://your-backend.onrender.com/docs`
- **Health Check**: `https://your-backend.onrender.com/health`

## Maintenance

### ✅ Regular Tasks
- [ ] Monitor service health
- [ ] Update dependencies regularly
- [ ] Monitor usage and costs
- [ ] Backup database regularly
- [ ] Review and update security settings

### ✅ Scaling Considerations
- [ ] Monitor response times
- [ ] Consider upgrading to paid plans for production
- [ ] Implement caching if needed
- [ ] Consider CDN for static assets
