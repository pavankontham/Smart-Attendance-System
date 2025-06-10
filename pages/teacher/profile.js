import { useState, useEffect, useRef } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import { User, Camera, Upload, Save, Edit3, Mail, Calendar, Shield, BookOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import SubjectInput from '../../src/components/SubjectInput';

export default function TeacherProfile() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: ''
  });
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchProfilePhoto();
    }
  }, [currentUser]);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        subject: userProfile.subject || ''
      });
    }
  }, [userProfile]);

  async function fetchProfilePhoto() {
    try {
      const { data } = await dbHelpers.getProfilePhoto(currentUser.uid);
      if (data && data.profile_photo_url) {
        setProfilePhoto(data.profile_photo_url);
        setPreviewUrl(data.profile_photo_url);
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }
    
    setIsUploading(true);
    try {
      const { data, error } = await dbHelpers.saveProfilePhoto(currentUser.uid, selectedFile);
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setProfilePhoto(data.profile_photo_url);
      setSelectedFile(null);
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      toast.error('Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  }

  function resetPhoto() {
    setSelectedFile(null);
    setPreviewUrl(profilePhoto);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleEditClick() {
    setIsEditing(true);
    setEditForm({
      name: userProfile?.name || '',
      subject: userProfile?.subject || ''
    });
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditForm({
      name: userProfile?.name || '',
      subject: userProfile?.subject || ''
    });
  }

  async function handleSaveProfile() {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!editForm.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    try {
      setIsProcessing(true);
      const { data, error } = await dbHelpers.updateUserProfile(currentUser.uid, {
        name: editForm.name.trim(),
        subject: editForm.subject.trim()
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);

      // Refresh user profile in context
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <User className="h-12 w-12 text-white/80" />
                </div>
              )}
              {selectedFile && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Edit3 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Teacher Profile</h1>
              <p className="text-purple-100 text-lg">Manage your profile information and photo</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="h-6 w-6 text-purple-600 mr-3" />
              Profile Information
            </h2>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isProcessing}
                  className="flex items-center px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-green-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isProcessing}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{userProfile?.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-lg font-semibold text-gray-900">{userProfile?.email}</p>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{userProfile?.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  {isEditing ? (
                    <SubjectInput
                      value={editForm.subject}
                      onChange={(value) => setEditForm({ ...editForm, subject: value })}
                      placeholder="Enter your subject"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">
                      {userProfile?.subject || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Camera className="h-6 w-6 text-purple-600 mr-3" />
            Profile Photo
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Photo Preview */}
            <div className="text-center">
              <div className="relative inline-block">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="w-48 h-48 rounded-full object-cover border-4 border-gray-200 shadow-lg mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 mx-auto">
                    <User className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                {selectedFile && (
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {selectedFile ? 'New photo selected' : 'Current profile photo'}
              </p>
            </div>

            {/* Upload Controls */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Options</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center px-6 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-xl transition-colors border-2 border-blue-200 hover:border-blue-300"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Choose File
                  </button>
                  
                  <button
                    onClick={startCamera}
                    className="flex items-center justify-center px-6 py-4 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-xl transition-colors border-2 border-green-200 hover:border-green-300"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Selected File:</p>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 inline mr-2" />
                          Save Photo
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetPhoto}
                      className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 space-y-1">
                <p>• Supported formats: JPG, PNG, GIF</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended: Square images (1:1 ratio)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Take Photo</h3>
                <button 
                  onClick={stopCamera}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
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
                  className="w-full rounded-lg bg-gray-900"
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
        )}
      </div>
    </Layout>
  );
}

