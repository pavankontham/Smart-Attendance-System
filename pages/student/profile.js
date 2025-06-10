import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { dbHelpers } from '../../lib/supabase';
import { User, Mail, Calendar, Shield, Eye, Trash2, CheckCircle, AlertCircle, BookOpen, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function StudentProfile() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrolledImage, setEnrolledImage] = useState(null);
  const [showEnrolledImage, setShowEnrolledImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    student_id: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        student_id: userProfile.student_id || ''
      });
    }
  }, [userProfile]);

  async function fetchProfileData() {
    try {
      // Fetch profile photo
      const { data: photoData } = await dbHelpers.getProfilePhoto(currentUser.uid);
      if (photoData && photoData.profile_photo_url) {
        setProfilePhoto(photoData.profile_photo_url);
      }

      // Fetch enrollment status
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/face-encodings/${currentUser.uid}`
      );
      if (response.data.success) {
        setEnrollmentStatus(response.data);
      }

      // Fetch enrolled image
      const { data: imageData } = await dbHelpers.getEnrolledImage(currentUser.uid);
      if (imageData && imageData.enrolled_image_url) {
        setEnrolledImage(imageData.enrolled_image_url);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEnrollment() {
    if (!confirm('Are you sure you want to delete your face enrollment? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/face-encodings/${currentUser.uid}`
      );

      if (response.data.success) {
        toast.success('Face enrollment deleted successfully!');
        await fetchProfileData();
      } else {
        toast.error(response.data.message || 'Failed to delete enrollment');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to delete enrollment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleEditClick() {
    setIsEditing(true);
    setEditForm({
      name: userProfile?.name || '',
      student_id: userProfile?.student_id || ''
    });
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditForm({
      name: userProfile?.name || '',
      student_id: userProfile?.student_id || ''
    });
  }

  async function handleSaveProfile() {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setIsProcessing(true);
      const { data, error } = await dbHelpers.updateUserProfile(currentUser.uid, {
        name: editForm.name.trim(),
        student_id: editForm.student_id.trim()
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <User className="h-12 w-12 text-white/80" />
                </div>
              )}
              {enrollmentStatus?.enrolled && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Student Profile</h1>
              <p className="text-blue-100 text-lg">Manage your profile and face enrollment</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              Profile Information
            </h2>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
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
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <BookOpen className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Student ID</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.student_id}
                      onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your student ID"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{userProfile?.student_id || 'Not assigned'}</p>
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

        {/* Face Enrollment Status */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            Face Enrollment Status
          </h2>
          
          {enrollmentStatus?.enrolled ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">Face Successfully Enrolled</h3>
                    <p className="text-green-600">
                      Enrolled on {new Date(enrollmentStatus.enrolled_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      You can now mark attendance using face recognition
                    </p>
                  </div>
                </div>
                
                {profilePhoto && (
                  <div className="flex items-center space-x-3">
                    <img
                      src={profilePhoto}
                      alt="Enrolled face"
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow-lg"
                    />
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => setShowEnrolledImage(true)}
                        className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Image
                      </button>
                      <button
                        onClick={deleteEnrollment}
                        disabled={isProcessing}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-1">No Face Enrolled</h3>
                  <p className="text-yellow-600 mb-3">
                    You need to enroll your face to mark attendance using face recognition
                  </p>
                  <button
                    onClick={() => window.location.href = '/student/enroll'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Enroll Your Face
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/student/attendance'}
              className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark Attendance
            </button>
            
            <button
              onClick={() => window.location.href = '/student/history'}
              className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200"
            >
              <Calendar className="h-5 w-5 mr-2" />
              View History
            </button>
            
            <button
              onClick={() => window.location.href = '/student/enroll'}
              className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors border border-purple-200"
            >
              <Shield className="h-5 w-5 mr-2" />
              Manage Enrollment
            </button>
          </div>
        </div>

        {/* Enrolled Image Modal */}
        {showEnrolledImage && enrolledImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Enrolled Face Image</h3>
                <button
                  onClick={() => setShowEnrolledImage(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center">
                <img
                  src={enrolledImage}
                  alt="Enrolled face"
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-600 mt-4">
                  Enrolled on {enrollmentStatus?.enrolled_at ? new Date(enrollmentStatus.enrolled_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
