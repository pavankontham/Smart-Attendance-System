import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { dbHelpers } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Camera, User, Users, Sparkles, ArrowRight, UserPlus } from 'lucide-react';
import SubjectInput from '../components/SubjectInput';

export default function CompleteProfile() {
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    studentId: '',
    subject: ''
  });
  const [existingSubjects, setExistingSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Redirect if profile already exists
    if (userProfile) {
      if (userProfile.role === 'student') {
        router.push('/student/dashboard');
      } else if (userProfile.role === 'teacher') {
        router.push('/teacher/dashboard');
      }
      return;
    }

    // Pre-fill name from Google account if available
    if (currentUser.displayName) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName
      }));
    }

    // Fetch existing subjects
    fetchSubjects();
  }, [currentUser, userProfile, router]);

  async function fetchSubjects() {
    try {
      const { data, error } = await dbHelpers.getAllSubjects();
      if (!error && data) {
        setExistingSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.role === 'student' && !formData.studentId) {
      toast.error('Student ID is required for students');
      return;
    }

    if (formData.role === 'teacher' && !formData.subject) {
      toast.error('Subject is required for teachers');
      return;
    }

    try {
      setLoading(true);
      
      // Create user profile in database
      const profileData = {
        firebase_id: currentUser.uid,
        email: currentUser.email,
        name: formData.name,
        role: formData.role,
        student_id: formData.role === 'student' ? formData.studentId : null,
        subject: formData.role === 'teacher' ? formData.subject : null,
        created_at: new Date().toISOString()
      };

      const { error } = await dbHelpers.createUser(profileData);
      if (error) {
        throw new Error(error.message);
      }

      toast.success('Profile completed successfully!');
      
      // Redirect to appropriate dashboard
      if (formData.role === 'student') {
        router.push('/student/dashboard');
      } else if (formData.role === 'teacher') {
        router.push('/teacher/dashboard');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white" />
          </div>
          <p className="text-white/80 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Complete Your Profile
          </h2>
          <p className="text-blue-100 text-lg">
            Just one more step to get started with Smart Attendance
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student', studentId: '' })}
                    className={`flex items-center justify-center p-4 border rounded-xl transition-all ${
                      formData.role === 'student'
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-lg'
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'teacher', studentId: '', subject: '' })}
                    className={`flex items-center justify-center p-4 border rounded-xl transition-all ${
                      formData.role === 'teacher'
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-lg'
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Teacher
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {formData.role === 'student' && (
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-white mb-2">
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>
              )}

              {formData.role === 'teacher' && (
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                    Subject *
                  </label>
                  <SubjectInput
                    value={formData.subject}
                    onChange={(value) => setFormData({ ...formData, subject: value })}
                    placeholder="Enter your subject (e.g., Mathematics, Physics)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    existingSubjects={existingSubjects}
                    required
                  />
                  <p className="text-xs text-blue-200 mt-1">
                    This will be used for creating and managing your classes
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:from-yellow-300 hover:to-orange-300 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin mr-3"></div>
                    Completing profile...
                  </div>
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
