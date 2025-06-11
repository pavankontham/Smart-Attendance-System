import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Camera, LogOut, User, Users, Calendar, Settings, BarChart3, Upload, BookOpen, Clock, Timer, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { dbHelpers } from '../lib/supabase';

export default function Layout({ children }) {
  const { currentUser, userProfile, logout } = useAuth();
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfilePhoto();
    }
  }, [currentUser]);

  async function fetchProfilePhoto() {
    try {
      const { data } = await dbHelpers.getProfilePhoto(currentUser.uid);
      if (data && data.profile_photo_url) {
        setProfilePhoto(data.profile_photo_url);
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  }

  async function handleProfilePhotoUpload(file) {
    try {
      const { data, error } = await dbHelpers.saveProfilePhoto(currentUser.uid, file);
      if (error) {
        toast.error(error.message);
        return;
      }

      setProfilePhoto(data.profile_photo_url);
      setShowProfileUpload(false);
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      toast.error('Failed to upload profile photo');
    }
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isTeacher = userProfile.role === 'teacher';
  const isStudent = userProfile.role === 'student';

  const navigation = [
    ...(isStudent ? [
      { name: 'Dashboard', href: '/student/dashboard', icon: User },
      { name: 'My Classes', href: '/student/classes', icon: BookOpen },
      { name: 'Timetable', href: '/student/timetable', icon: Clock },
      { name: 'Quick Attendance', href: '/student/instant-attendance', icon: Timer },
      { name: 'My Attendance', href: '/student/history', icon: Calendar },
      { name: 'Enroll Face', href: '/student/enroll', icon: Settings },
      { name: 'Profile', href: '/student/profile', icon: User },
    ] : []),
    ...(isTeacher ? [
      { name: 'Dashboard', href: '/teacher/dashboard', icon: Users },
      { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
      { name: 'Timetable', href: '/teacher/timetable', icon: Clock },
      { name: 'Instant Attendance', href: '/teacher/instant-attendance', icon: Timer },
      { name: 'Students', href: '/teacher/students', icon: User },
      { name: 'Reports', href: '/teacher/reports', icon: Calendar },
      { name: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
      { name: 'Profile', href: '/teacher/profile', icon: Settings },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-24">
            {/* Logo Section - Flex Item 1 */}
            <div className="flex-shrink-0">
              <Link href={userProfile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
                <div className="relative">
                  <Camera className="h-10 w-10 text-blue-600 mr-4" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-bold text-gray-900">
                    Smart Attendance
                  </span>
                  <p className="text-sm text-blue-600 font-medium">AI-Powered Recognition</p>
                </div>
                <div className="sm:hidden">
                  <span className="text-xl font-bold text-gray-900">
                    Smart Attendance
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Section - Flex Item 2 (grows to fill space) */}
            <div className="flex-1 flex justify-center items-center mx-4">
              {/* Desktop Navigation - All tiles side by side for tablets and laptops (md and above) */}
              <div className="hidden md:flex items-center justify-center space-x-1 w-full overflow-x-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'text-blue-600 bg-blue-50 shadow-sm border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section - Flex Item 3 */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              {/* Mobile menu button - Only for mobile (below md) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Profile Section */}
              <div className="flex items-center space-x-3">
                {/* Profile Photo and Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative group">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm cursor-pointer hover:border-blue-400 transition-all"
                        onClick={() => userProfile.role === 'teacher' && setShowProfileUpload(true)}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition-all"
                        onClick={() => userProfile.role === 'teacher' && setShowProfileUpload(true)}
                      >
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    {userProfile.role === 'teacher' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                           onClick={() => setShowProfileUpload(true)}>
                        <Upload className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <Link
                      href={userProfile.role === 'teacher' ? '/teacher/profile' : '/student/profile'}
                      className="text-sm hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer block"
                    >
                      <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{userProfile.name}</div>
                      <div className="text-gray-500 capitalize flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          userProfile.role === 'teacher' ? 'bg-purple-400' : 'bg-blue-400'
                        }`}></span>
                        {userProfile.role}
                      </div>
                    </Link>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                  <span className="md:hidden">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {/* Navigation Items */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 shadow-sm border border-blue-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Profile Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <Link
                href={userProfile.role === 'teacher' ? '/teacher/profile' : '/student/profile'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-blue-200 mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200 mr-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{userProfile?.name || 'User'}</div>
                    <div className="text-sm text-gray-500 capitalize flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        userProfile.role === 'teacher' ? 'bg-purple-400' : 'bg-blue-400'
                      }`}></span>
                      {userProfile.role}
                    </div>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 text-base text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 mt-2"
              >
                <LogOut className="h-5 w-5 mr-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Profile Photo Upload Modal for Teachers */}
      {showProfileUpload && userProfile.role === 'teacher' && (
        <ProfilePhotoUploadModal
          onClose={() => setShowProfileUpload(false)}
          onUpload={handleProfilePhotoUpload}
          currentPhoto={profilePhoto}
        />
      )}
    </div>
  );
}

// Profile Photo Upload Modal Component
function ProfilePhotoUploadModal({ onClose, onUpload, currentPhoto }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentPhoto);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
    } finally {
      setIsUploading(false);
    }
  }

  function handleCameraCapture(imageSrc) {
    // Convert base64 to blob
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(imageSrc);
        setShowCamera(false);
      });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Update Profile Photo</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="text-center mb-6">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mx-auto shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
              <User className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Options */}
        <div className="space-y-4">
          <div className="flex space-x-3">
            <label className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-xl cursor-pointer transition-colors text-center">
              <Upload className="h-5 w-5 inline mr-2" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowCamera(true)}
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              <Camera className="h-5 w-5 inline mr-2" />
              Take Photo
            </button>
          </div>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </button>
          )}
        </div>

        {/* Camera Component */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    </div>
  );
}

// Simple Camera Capture Component
function CameraCapture({ onCapture, onClose }) {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera');
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageSrc = canvas.toDataURL('image/jpeg');
      onCapture(imageSrc);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Take Photo</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />

          <button
            onClick={capturePhoto}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Camera className="h-5 w-5 inline mr-2" />
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
}
