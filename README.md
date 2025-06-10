# Face Recognition Attendance System

A comprehensive attendance management system using advanced face recognition technology with anti-spoofing liveness detection. Built with React (Next.js), Firebase Authentication, Supabase database, and Python FastAPI backend.

## 🚀 Features

### 👨‍🎓 Student Features
- **Face Enrollment**: Secure face registration with liveness verification
- **Quick Attendance**: Mark attendance using class-specific codes and face recognition
- **Class Management**: Join classes and view enrolled subjects
- **Attendance History**: Track personal attendance records and statistics
- **Profile Management**: Update profile information and view enrolled face images
- **Real-time Dashboard**: See attendance statistics and class schedules

### 👨‍🏫 Teacher Features
- **Class Creation**: Create and manage classes with subject assignments
- **Student Management**: View enrolled students and manage class rosters
- **Quick Attendance Sessions**: Generate time-limited attendance codes for classes
- **Attendance Monitoring**: Real-time attendance tracking with manual override options
- **Timetable Management**: Automated class scheduling with customizable time slots
- **Detailed Reports**: Generate and export attendance reports
- **Dashboard Analytics**: Comprehensive overview of attendance statistics

### 🔒 Security Features
- **Firebase Authentication**: Secure Google OAuth integration
- **Role-based Access Control**: Separate student and teacher interfaces
- **Advanced Liveness Detection**: MediaPipe-based anti-spoofing with blink detection
- **Face Encoding Security**: Only mathematical representations stored, not images
- **Time-limited Sessions**: 3-minute attendance windows for enhanced security
- **Secure API**: Protected backend endpoints with proper authentication

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with Server-Side Rendering
- **React 18**: Modern React with hooks and context
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Webcam**: Camera integration for face capture
- **Lucide React**: Modern icon library
- **React Hot Toast**: Beautiful notification system
- **Headless UI**: Accessible UI components

### Backend
- **FastAPI**: High-performance Python web framework
- **OpenCV**: Computer vision library for image processing
- **face_recognition**: Advanced face recognition library
- **MediaPipe**: Google's ML framework for liveness detection
- **Pillow (PIL)**: Python Imaging Library for image manipulation
- **Uvicorn**: ASGI server for FastAPI

### Database & Authentication
- **Supabase**: PostgreSQL database with real-time features
- **Firebase Auth**: Google OAuth authentication service
- **Row Level Security (RLS)**: Database-level security policies

### Development Tools
- **ESLint**: Code linting for JavaScript/React
- **PostCSS**: CSS processing with Autoprefixer
- **Python Virtual Environment**: Isolated Python dependencies

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Python 3.8+** (3.9+ recommended)
- **Git** for version control
- **Modern web browser** with camera support
- **Good lighting** for face recognition accuracy

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd face-recognition-attendance-system
```

### 2. Frontend Setup

Install Node.js dependencies:
```bash
npm install
```

Create environment file (if not exists):
```bash
# Copy .env.local.example to .env.local and configure
cp .env.local.example .env.local
```

### 3. Backend Setup

Navigate to backend directory:
```bash
cd backend
```

Create and activate virtual environment:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Create backend environment file:
```bash
# Create .env file in backend directory with your Supabase credentials
# See backend/.env.example for required variables
```

### 4. Database Setup

1. **Create Supabase Project**:
   - Go to [Supabase](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Run Database Schema**:
   - In Supabase SQL Editor, run the complete schema from `database_complete_setup.sql`
   - This includes all tables, RLS policies, and initial data

3. **Configure Environment Variables**:
   - Update `.env.local` with your Supabase credentials
   - Update `backend/.env` with your Supabase credentials

### 5. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project and enable Authentication
   - Enable Google Sign-in provider

2. **Configure Firebase**:
   - Update `lib/firebase.js` with your Firebase config
   - Add your domain to authorized domains in Firebase Auth settings

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server

In the `backend` directory with virtual environment activated:
```bash
python main.py
```

The FastAPI server will be available at:
- **API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 2. Start the Frontend Development Server

In the root directory:
```bash
npm run dev
```

The Next.js application will be available at:
- **Frontend**: `http://localhost:3000`

### 3. Production Build

For production deployment:
```bash
# Build the frontend
npm run build
npm start

# Backend runs the same way
cd backend
python main.py
```

## 📖 Usage Guide

### 🎯 First Time Setup

1. **User Registration**
   - Navigate to `http://localhost:3000`
   - Click "Register" and select your role (Student/Teacher)
   - Complete Google OAuth authentication
   - Fill in profile information including subject specialization

2. **For Students - Face Enrollment**
   - Login to your student account
   - Navigate to "Enroll Face" from the dashboard
   - **Important**: Ensure good lighting and look directly at the camera
   - Follow liveness detection prompts (blink when instructed)
   - Capture multiple angles for better recognition accuracy

3. **For Teachers - Profile Setup**
   - Complete profile with subject specialization
   - Upload profile photo or use camera capture
   - Set up your teaching subjects and preferences

### 👨‍🎓 Student Workflow

1. **Join Classes**
   - Browse available classes in "My Classes"
   - Join classes relevant to your subjects
   - View class schedules and timetables

2. **Mark Attendance (Quick Attendance)**
   - Get the 6-digit class code from your teacher
   - Enter the code in "Quick Attendance"
   - Complete face recognition within the 3-minute window
   - Receive confirmation of successful attendance

3. **View Attendance History**
   - Check your attendance records
   - View statistics and patterns
   - Monitor your attendance percentage

### 👨‍🏫 Teacher Workflow

1. **Create and Manage Classes**
   - Create new classes with subject assignments
   - Add students individually or in bulk by ID range
   - Set up automated timetables with customizable slots

2. **Conduct Attendance Sessions**
   - Start a "Quick Attendance" session for your class
   - Share the generated 6-digit code with students
   - Monitor real-time attendance marking
   - Use manual override for special cases
   - Stop session when complete (invalidates the code)

3. **Monitor and Report**
   - View real-time attendance dashboard
   - Generate detailed attendance reports
   - Export data for external analysis
   - Track student attendance patterns

## 🔌 API Documentation

### Face Recognition Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `POST` | `/enroll` | Enroll user's face with liveness detection | `image`, `user_id` |
| `POST` | `/recognize` | Recognize face for attendance | `image`, `user_id`, `class_id` |
| `POST` | `/verify-liveness` | Verify if image contains live person | `image` |
| `GET` | `/health` | API health check | None |
| `GET` | `/docs` | Interactive API documentation | None |

### Class Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/classes` | Get all classes |
| `POST` | `/classes` | Create new class |
| `GET` | `/classes/{class_id}/students` | Get class students |
| `POST` | `/attendance/quick-start` | Start quick attendance session |
| `POST` | `/attendance/quick-mark` | Mark attendance with code |

### Request Examples

**Enroll Face with Liveness Detection:**
```bash
curl -X POST "http://localhost:8000/enroll" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@face_image.jpg" \
  -F "user_id=uuid-string"
```

**Quick Attendance Recognition:**
```bash
curl -X POST "http://localhost:8000/recognize" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@face_image.jpg" \
  -F "user_id=uuid-string" \
  -F "class_id=class-uuid"
```

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "error": null
}
```

## 🗄️ Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User profiles and authentication | `id`, `email`, `role`, `full_name`, `subject` |
| `face_encodings` | Stored face mathematical representations | `user_id`, `encoding_data`, `created_at` |
| `classes` | Class information and management | `id`, `name`, `subject`, `teacher_id`, `class_code` |
| `class_students` | Student-class relationships | `class_id`, `student_id`, `joined_at` |
| `attendance` | Attendance records | `user_id`, `class_id`, `timestamp`, `method` |
| `subjects` | Available subjects with codes | `code`, `name`, `description` |
| `timetable` | Class scheduling | `class_id`, `day_of_week`, `start_time`, `end_time` |
| `quick_attendance_sessions` | Time-limited attendance sessions | `class_id`, `code`, `expires_at`, `is_active` |

### Key Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Real-time Subscriptions**: Live updates for attendance and class changes
- **Automated Timestamps**: Tracks creation and modification times
- **Foreign Key Constraints**: Maintains data integrity
- **Indexed Queries**: Optimized for fast lookups

### Schema Files

- `database_complete_setup.sql` - Complete database setup with all tables and policies
- `supabase/schema.sql` - Core schema definition
- `backend/database_schema.sql` - Backend-specific schema updates

For complete schema details, see the SQL files in the project root and `supabase/` directory.

## 🔐 Security Features

### Anti-Spoofing Measures
- **MediaPipe Liveness Detection**: Real-time face mesh analysis
- **Blink Detection**: Requires natural blinking during enrollment
- **Motion Analysis**: Detects static images vs. live video
- **Quality Checks**: Ensures sufficient image quality for recognition

### Data Protection
- **Face Encoding Storage**: Only mathematical representations stored, never actual images
- **Encrypted Transmission**: All API calls use HTTPS
- **Secure Authentication**: Firebase Auth with Google OAuth
- **Environment Variables**: Sensitive credentials stored securely

### Access Control
- **Role-based Permissions**: Separate student and teacher interfaces
- **Row Level Security (RLS)**: Database-level access control
- **Session Management**: Time-limited attendance sessions (3 minutes)
- **API Authentication**: Protected backend endpoints

### Privacy Compliance
- **No Image Storage**: Face images are processed and discarded
- **Data Minimization**: Only necessary data is collected and stored
- **User Consent**: Clear enrollment process with user acknowledgment
- **Audit Trail**: All attendance actions are logged with timestamps

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 📷 Camera Issues
| Problem | Solution |
|---------|----------|
| Camera not detected | Check browser permissions, ensure no other apps are using camera |
| Poor image quality | Improve lighting, clean camera lens, check camera resolution |
| Webcam component not loading | Refresh page, check React Webcam compatibility |

#### 🤖 Face Recognition Issues
| Problem | Solution |
|---------|----------|
| Face not recognized | Ensure good lighting, re-enroll if needed, check face positioning |
| Liveness detection failing | Follow blink prompts, avoid static images, ensure natural movement |
| Low recognition accuracy | Re-enroll with better lighting, capture multiple angles |
| Enrollment failing | Check image quality, ensure face is clearly visible and well-lit |

#### 🔗 Connection Issues
| Problem | Solution |
|---------|----------|
| Backend API not responding | Verify Python server is running on port 8000, check console for errors |
| Frontend not loading | Ensure `npm run dev` is running, check port 3000 availability |
| Database connection failed | Verify Supabase credentials in environment files |
| Authentication errors | Check Firebase configuration, verify Google OAuth setup |

#### ⚡ Performance Issues
| Problem | Solution |
|---------|----------|
| Slow face recognition | Optimize image size, check server resources, ensure good internet connection |
| High memory usage | Restart backend server, check for memory leaks in face processing |
| Slow page loading | Clear browser cache, check network connection, optimize images |

### 🛠️ Development Tips

#### Face Recognition Optimization
- **Lighting**: Use consistent, bright lighting for enrollment and recognition
- **Positioning**: Keep face centered and at appropriate distance from camera
- **Quality**: Ensure high-resolution camera for better accuracy
- **Testing**: Test with different users, lighting conditions, and angles

#### Database Debugging
- **Supabase Dashboard**: Use the built-in SQL editor for query testing
- **RLS Policies**: Check Row Level Security policies if data access issues occur
- **Logs**: Monitor Supabase logs for database errors
- **Performance**: Use query explain plans for optimization

#### API Development
- **FastAPI Docs**: Use `/docs` endpoint for interactive API testing
- **Logging**: Check backend console for detailed error messages
- **CORS**: Ensure proper CORS configuration for frontend-backend communication
- **Environment**: Verify all environment variables are properly set

## 🤝 Contributing

We welcome contributions to improve the Face Recognition Attendance System! Here's how you can help:

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Set up the development environment** following the installation guide

### Development Workflow
1. **Make your changes** with clear, descriptive commits
2. **Test thoroughly** - ensure all features work as expected
3. **Update documentation** if you're adding new features
4. **Follow code style** - use ESLint for frontend, PEP 8 for Python
5. **Submit a pull request** with a clear description of changes

### Areas for Contribution
- 🐛 **Bug fixes** - Help resolve issues and improve stability
- ✨ **New features** - Add functionality like bulk operations, advanced reporting
- 📚 **Documentation** - Improve guides, add examples, fix typos
- 🎨 **UI/UX improvements** - Enhance design and user experience
- 🔧 **Performance optimization** - Improve speed and efficiency
- 🧪 **Testing** - Add unit tests, integration tests, and test coverage

### Code Style Guidelines
- **Frontend**: Follow React best practices, use functional components with hooks
- **Backend**: Follow PEP 8, use type hints, add docstrings
- **Database**: Use meaningful table/column names, add appropriate indexes
- **Git**: Use conventional commit messages (feat:, fix:, docs:, etc.)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❗ License and copyright notice required

## 🆘 Support & Community

### Getting Help
1. **📖 Documentation**: Check this README and inline code comments
2. **🔍 Troubleshooting**: Review the troubleshooting section above
3. **🐛 Issues**: Search existing GitHub issues or create a new one
4. **💬 Discussions**: Use GitHub Discussions for questions and ideas

### Reporting Issues
When reporting bugs, please include:
- **Environment details** (OS, Python version, Node.js version)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots or logs** if applicable
- **Browser and camera information** for frontend issues

### Feature Requests
We love hearing about new ideas! When suggesting features:
- **Describe the use case** and problem it solves
- **Provide examples** of how it would work
- **Consider security implications** for face recognition features
- **Think about user experience** and ease of use

---

## 🙏 Acknowledgments

- **OpenCV** and **face_recognition** libraries for computer vision capabilities
- **MediaPipe** by Google for advanced liveness detection
- **Firebase** for authentication services
- **Supabase** for database and real-time features
- **Next.js** and **React** teams for the excellent frontend framework
- **FastAPI** for the high-performance backend framework

---

**Built with ❤️ for educational institutions and organizations needing secure, modern attendance management.**

---

## 🌐 Deployment Guide (Render)

This section provides step-by-step instructions for deploying your Face Recognition Attendance System to Render.

### Prerequisites for Deployment

- **GitHub Repository**: Your code should be pushed to a GitHub repository
- **Render Account**: Sign up at [render.com](https://render.com)
- **Supabase Project**: Already set up with your database
- **Firebase Project**: Already configured for authentication

### 📁 Project Structure for Deployment

Your project has two main components:
- **Frontend**: Next.js application (root directory)
- **Backend**: FastAPI application (`backend/` directory)

### 🔧 Step 1: Prepare Your Repository

1. **Ensure your code is pushed to GitHub**:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

2. **Verify your .gitignore** (already created):
   - Environment files are ignored
   - Node modules and Python cache are ignored
   - Build artifacts are ignored

### 🐍 Step 2: Deploy Backend (FastAPI)

#### 2.1 Create Backend Service on Render

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect your GitHub repository**
3. **Configure the service**:

| Setting | Value |
|---------|-------|
| **Name** | `face-recognition-backend` |
| **Environment** | `Python 3` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python main.py` |

#### 2.2 Environment Variables for Backend

Add these environment variables in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | `your-supabase-url` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase service role key |
| `PYTHON_VERSION` | `3.9.18` | Specify Python version |

#### 2.3 Backend Deployment Configuration

Create `backend/render.yaml` (optional):
```yaml
services:
  - type: web
    name: face-recognition-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.18
```

### ⚛️ Step 3: Deploy Frontend (Next.js)

#### 3.1 Create Frontend Service on Render

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect your GitHub repository**
3. **Configure the service**:

| Setting | Value |
|---------|-------|
| **Name** | `face-recognition-frontend` |
| **Branch** | `main` |
| **Root Directory** | `/` (root) |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` |

#### 3.2 Update Next.js Configuration

Update `next.config.js` for static export:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
}

module.exports = nextConfig
```

#### 3.3 Update Package.json Scripts

Ensure your `package.json` has the correct build script:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export",
    "lint": "next lint"
  }
}
```

#### 3.4 Environment Variables for Frontend

Add these environment variables in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `your-firebase-api-key` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | `your-supabase-url` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` | Backend API URL |

### 🔗 Step 4: Connect Frontend and Backend

#### 4.1 Update CORS in Backend

Update the CORS configuration in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend.onrender.com",  # Add your frontend URL
        "https://face-recognition-frontend.onrender.com"  # Example
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4.2 Update API Calls in Frontend

Ensure your frontend API calls use the environment variable:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Example API call
const response = await fetch(`${API_URL}/api/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(userData),
});
```

### 🔒 Step 5: Security Configuration

#### 5.1 Update Firebase Auth Settings

1. **Go to Firebase Console** → **Authentication** → **Settings**
2. **Add your Render domains to Authorized domains**:
   - `your-frontend.onrender.com`
   - `face-recognition-frontend.onrender.com`

#### 5.2 Update Supabase Settings

1. **Go to Supabase Dashboard** → **Settings** → **API**
2. **Add your domains to CORS origins**:
   - `https://your-frontend.onrender.com`

### 🚀 Step 6: Deploy and Test

#### 6.1 Deployment Order

1. **Deploy Backend first** (it takes longer due to Python dependencies)
2. **Wait for backend to be live**
3. **Update frontend environment variables** with backend URL
4. **Deploy Frontend**

#### 6.2 Testing Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.onrender.com/health
   ```

2. **Frontend Access**:
   - Visit `https://your-frontend.onrender.com`
   - Test user registration and login
   - Test face enrollment and recognition

### 🔧 Step 7: Optimization for Production

#### 7.1 Backend Optimizations

Add to `backend/requirements.txt`:
```txt
# Existing dependencies...
gunicorn==21.2.0  # Production WSGI server
```

Update `backend/main.py` for production:
```python
if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

#### 7.2 Frontend Optimizations

Add to your build process:
```json
{
  "scripts": {
    "build": "next build && next export"
  }
}
```

### 🐛 Troubleshooting Deployment

#### Common Backend Issues

| Issue | Solution |
|-------|----------|
| **Build fails** | Check Python version, ensure all dependencies in requirements.txt |
| **Port binding error** | Ensure using `host="0.0.0.0"` and `PORT` environment variable |
| **Database connection fails** | Verify Supabase environment variables |
| **CORS errors** | Add frontend domain to CORS origins |

#### Common Frontend Issues

| Issue | Solution |
|-------|----------|
| **Build fails** | Check Node.js version, run `npm install` locally first |
| **API calls fail** | Verify `NEXT_PUBLIC_API_URL` environment variable |
| **Authentication issues** | Check Firebase configuration and authorized domains |
| **Static export issues** | Ensure `output: 'export'` in next.config.js |

### 📊 Monitoring and Logs

#### Backend Monitoring
- **Render Dashboard** → **Your Backend Service** → **Logs**
- Monitor API response times and error rates
- Set up health check endpoints

#### Frontend Monitoring
- **Render Dashboard** → **Your Frontend Service** → **Deploy Logs**
- Monitor build times and deployment success
- Check browser console for client-side errors

### 💰 Cost Optimization

#### Render Pricing Considerations
- **Free Tier**: Limited to 750 hours/month, spins down after 15 minutes of inactivity
- **Paid Tier**: Always-on services, better performance
- **Recommendation**: Start with free tier for testing, upgrade for production

### 🔄 Continuous Deployment

#### Auto-Deploy Setup
1. **Enable Auto-Deploy** in Render dashboard
2. **Connect to main branch**
3. **Automatic deployments** on every push to main

#### Deployment Workflow
```bash
# Development workflow
git add .
git commit -m "Add new feature"
git push origin main
# Render automatically deploys
```

---

**🎉 Your Face Recognition Attendance System is now live on Render!**

**Frontend URL**: `https://your-frontend.onrender.com`
**Backend API**: `https://your-backend.onrender.com`
