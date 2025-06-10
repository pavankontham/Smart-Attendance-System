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

## Security Considerations

1. **Liveness Detection**: Prevents photo/video spoofing
2. **Face Encoding Storage**: Only mathematical representations stored
3. **Role-based Access**: Students can only access their data
4. **Secure Authentication**: Firebase Auth integration
5. **Database Security**: Row Level Security enabled

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure browser has camera permissions
   - Check if camera is being used by another application

2. **Face not recognized**
   - Ensure good lighting conditions
   - Re-enroll face if needed
   - Check if face is clearly visible

3. **Backend connection issues**
   - Ensure Python backend is running on port 8000
   - Check if all dependencies are installed

4. **Database connection issues**
   - Verify Supabase credentials
   - Check if database schema is properly set up

### Development Tips

1. **Testing Face Recognition**
   - Use good lighting for better accuracy
   - Ensure face is properly positioned
   - Test with different angles and expressions

2. **Database Queries**
   - Use Supabase dashboard for debugging
   - Check RLS policies if data access issues occur

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database schema and RLS policies
4. Ensure all services are running correctly
