import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../src/contexts/AuthContext';
import { Camera, Users, Shield, BarChart3, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!loading && currentUser && userProfile) {
      if (userProfile.role === 'student') {
        router.push('/student/dashboard');
      } else if (userProfile.role === 'teacher') {
        router.push('/teacher/dashboard');
      }
    }
  }, [currentUser, userProfile, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white" />
          </div>
          <p className="text-white/80 text-lg">Loading Smart Attendance...</p>
        </div>
      </div>
    );
  }

  // Only show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="relative">
                <Camera className="h-10 w-10 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-white">
                  Smart Attendance
                </h1>
                <p className="text-blue-100 text-sm">AI-Powered Recognition</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-white hover:text-blue-200 font-medium py-2 px-4 rounded-lg transition-colors">
                Login
              </Link>
              <Link href="/register" className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
            Attendance
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Made Simple
            </span>
          </h2>

          <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Revolutionary face recognition technology with AI-powered liveness detection.
            Secure, contactless, and incredibly accurate attendance management for the modern world.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center">
              Register
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium py-4 px-8 rounded-xl transition-all border border-white/30">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Student Portal
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Effortless attendance marking with face recognition. Students can view their history, track progress, and manage their enrolled face data.
            </p>
          </div>

          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Teacher Dashboard
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Comprehensive analytics, student management, attendance reports, and enrolled image viewing. Export data with advanced filtering options.
            </p>
          </div>

          <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              AI-Powered Security
            </h3>
            <p className="text-blue-100 leading-relaxed">
              Advanced liveness detection, anti-spoofing technology, and encrypted data storage ensure maximum security and accuracy.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">&lt;2s</div>
              <div className="text-blue-100">Recognition Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">System Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-blue-100">Contactless</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
            <h3 className="text-4xl font-bold text-white mb-6">
              Transform Your Attendance Management
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of institutions already using our AI-powered attendance system.
              Register today and experience the future of attendance tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:from-yellow-300 hover:to-orange-300 font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center">
                Register Now
                <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Link>
              <Link href="/login" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium py-4 px-8 rounded-xl transition-all border border-white/30 flex items-center justify-center">
                <Clock className="mr-2 h-5 w-5" />
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/20 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Camera className="h-8 w-8 text-white mr-3" />
                <span className="text-xl font-bold text-white">Smart Attendance</span>
              </div>
              <p className="text-blue-100 mb-4">
                Leading the future of attendance management with AI-powered face recognition technology.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-blue-100">
                <li><Link href="/features/face-recognition" className="hover:text-white transition-colors cursor-pointer">Face Recognition</Link></li>
                <li><Link href="/features/liveness-detection" className="hover:text-white transition-colors cursor-pointer">Liveness Detection</Link></li>
                <li><Link href="/features/analytics" className="hover:text-white transition-colors cursor-pointer">Real-time Analytics</Link></li>
                <li><Link href="/features/reports" className="hover:text-white transition-colors cursor-pointer">Export Reports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-blue-100">
                <li><Link href="/docs" className="hover:text-white transition-colors cursor-pointer">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors cursor-pointer">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors cursor-pointer">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors cursor-pointer">System Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-blue-100">&copy; 2025 Smart Attendance System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
