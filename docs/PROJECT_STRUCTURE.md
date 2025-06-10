# 📁 Project Structure

## 🏗️ **Face Recognition Attendance System - Deployment-Friendly Structure**

```
face-recognition-attendance-system/
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # Reusable React components
│   │   ├── Layout.js               # Main layout wrapper
│   │   ├── LivenessWebcamCapture.js # Liveness detection camera
│   │   ├── SubjectInput.js         # Subject selection component
│   │   └── WebcamCapture.js        # Basic webcam component
│   ├── 📁 contexts/                # React context providers
│   │   └── AuthContext.js          # Authentication context
│   ├── 📁 lib/                     # External service configurations
│   │   ├── firebase.js             # Firebase configuration
│   │   └── supabase.js             # Supabase configuration
│   ├── 📁 utils/                   # Utility functions
│   ├── 📁 hooks/                   # Custom React hooks
│   └── 📁 types/                   # TypeScript type definitions
│
├── 📁 pages/                       # Next.js pages (routing)
│   ├── _app.js                     # App wrapper
│   ├── index.js                    # Home page
│   ├── login.js                    # Login page
│   ├── register.js                 # Registration page
│   ├── complete-profile.js         # Profile completion
│   ├── 📁 student/                 # Student-specific pages
│   └── 📁 teacher/                 # Teacher-specific pages
│
├── 📁 styles/                      # CSS and styling
│   └── globals.css                 # Global styles
│
├── 📁 backend/                     # Python FastAPI backend
│   ├── main.py                     # Main FastAPI application
│   ├── liveness_detection.py       # Liveness detection logic
│   ├── requirements.txt            # Python dependencies
│   ├── database_schema.sql         # Database schema
│   └── 📁 venv/                    # Virtual environment (ignored)
│
├── 📁 database/                    # Database related files
│   ├── database_complete_setup.sql # Complete database setup
│   └── schema.sql                  # Supabase schema
│
├── 📁 docs/                        # Documentation
│   ├── DEPLOYMENT_CHECKLIST.md    # Deployment guide
│   └── PROJECT_STRUCTURE.md       # This file
│
├── 📁 scripts/                     # Deployment and utility scripts
│   ├── deploy.bat                  # Windows deployment script
│   └── deploy.sh                   # Unix deployment script
│
├── 📁 node_modules/                # Node.js dependencies (ignored)
├── 📁 out/                         # Next.js build output (ignored)
│
├── 📄 package.json                 # Frontend dependencies
├── 📄 package-lock.json            # Dependency lock file
├── 📄 requirements.txt             # Root Python dependencies
├── 📄 next.config.js               # Next.js configuration
├── 📄 tailwind.config.js           # Tailwind CSS configuration
├── 📄 postcss.config.js            # PostCSS configuration
├── 📄 render.yaml                  # Render deployment config
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
└── 📄 README.md                    # Project documentation
```

## 🎯 **Directory Purposes**

### **Frontend Structure (`src/`)**
- **`components/`**: Reusable UI components
- **`contexts/`**: React context providers for state management
- **`lib/`**: External service configurations (Firebase, Supabase)
- **`utils/`**: Helper functions and utilities
- **`hooks/`**: Custom React hooks
- **`types/`**: TypeScript type definitions (future-ready)

### **Backend Structure (`backend/`)**
- **`main.py`**: FastAPI application entry point
- **`liveness_detection.py`**: Face liveness detection logic
- **`requirements.txt`**: Python dependencies
- **`database_schema.sql`**: Database schema definitions

### **Configuration Files**
- **`next.config.js`**: Next.js build and deployment settings
- **`tailwind.config.js`**: Tailwind CSS customization
- **`render.yaml`**: Render platform deployment configuration
- **`.env.example`**: Environment variables template

### **Documentation (`docs/`)**
- **`DEPLOYMENT_CHECKLIST.md`**: Step-by-step deployment guide
- **`PROJECT_STRUCTURE.md`**: Project organization documentation

### **Scripts (`scripts/`)**
- **`deploy.bat/.sh`**: Automated deployment helpers
- **Future**: Build scripts, database migration scripts

### **Database (`database/`)**
- **`database_complete_setup.sql`**: Complete database setup
- **`schema.sql`**: Supabase schema definitions
- **Future**: Migration scripts, seed data

## 🚀 **Benefits of This Structure**

1. **🔍 Clear Separation**: Frontend, backend, docs, and scripts are clearly separated
2. **📦 Scalable**: Easy to add new components, utilities, and features
3. **🛠️ Maintainable**: Logical organization makes code easier to find and modify
4. **🚀 Deployment-Ready**: Optimized for CI/CD and cloud deployment
5. **👥 Team-Friendly**: New developers can quickly understand the codebase
6. **📚 Well-Documented**: Clear documentation and examples

## 🔄 **Import Path Updates**

With the new structure, import paths have been updated:

```javascript
// Old imports
import Layout from '../components/Layout'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// New imports (deployment-friendly)
import Layout from '../src/components/Layout'
import { AuthContext } from '../src/contexts/AuthContext'
import { supabase } from '../src/lib/supabase'
```

## 🎯 **Next Steps**

1. ✅ **Structure Reorganized**: Files moved to proper directories
2. 🔄 **Update Imports**: Fix import paths in components
3. 📝 **Update Documentation**: Ensure all docs reflect new structure
4. 🚀 **Test Deployment**: Verify everything works with new structure
5. 🔧 **Add Utilities**: Create helper functions in `src/utils/`
6. 🎣 **Add Hooks**: Create custom hooks in `src/hooks/`
