import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Users, BookOpen, Calendar, Settings, Eye, Trash2, Copy, Check, UserPlus } from 'lucide-react';
import SubjectInput from '../../src/components/SubjectInput';

export default function TeacherClasses() {
  const { currentUser, userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [existingSubjects, setExistingSubjects] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchClasses();
      fetchSubjects();
    }
  }, [currentUser]);

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

  async function fetchClasses() {
    try {
      const { data, error } = await dbHelpers.getClassesByTeacher(currentUser.uid);
      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('Database connection')) {
          errorMessage = 'Unable to connect to database. Please try again.';
        } else if (errorMessage.includes('Teacher not found')) {
          errorMessage = 'Teacher account not found. Please contact support.';
        } else if (errorMessage.includes('permission')) {
          errorMessage = 'You don\'t have permission to view classes.';
        }
        toast.error(errorMessage);
      } else {
        setClasses(data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      let errorMessage = 'Failed to fetch classes. Please try again.';

      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again in a moment.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateClass(classData) {
    try {
      const { data, error } = await dbHelpers.createClass({
        ...classData,
        teacher_firebase_id: currentUser.uid
      });

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('already exists')) {
          errorMessage = 'A class with this name already exists. Please choose a different name.';
        } else if (errorMessage.includes('Invalid subject')) {
          errorMessage = 'Invalid subject selected. Please choose a valid subject.';
        } else if (errorMessage.includes('permission')) {
          errorMessage = 'You don\'t have permission to create classes.';
        } else if (errorMessage.includes('Database connection')) {
          errorMessage = 'Connection error. Please try again in a moment.';
        }
        toast.error(errorMessage);
      } else {
        toast.success('Class created successfully!');
        setShowCreateModal(false);
        fetchClasses();
      }
    } catch (error) {
      console.error('Error creating class:', error);
      let errorMessage = 'Failed to create class. Please try again.';

      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again in a moment.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      }

      toast.error(errorMessage);
    }
  }

  async function viewClassStudents(classItem) {
    setSelectedClass(classItem);
    setShowStudentsModal(true);
  }

  async function addStudentsToClass(classItem) {
    setSelectedClass(classItem);
    setShowAddStudentsModal(true);
  }

  async function manageClass(classItem) {
    setSelectedClass(classItem);
    setShowManageModal(true);
  }

  function copyClassCode(classCode) {
    navigator.clipboard.writeText(classCode);
    toast.success('Class code copied to clipboard!');
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">My Classes</h1>
                <p className="text-purple-100 text-lg">Manage your classes and students</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              <Plus className="h-5 w-5 mr-2 inline" />
              Create Class
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Yet</h3>
            <p className="text-gray-600 mb-6">Create your first class to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{classItem.name}</h3>
                    <p className="text-purple-600 font-medium">{classItem.subject}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyClassCode(classItem.class_code)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy class code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{classItem.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {classItem.student_count || 0} students
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    {classItem.class_code}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewClassStudents(classItem)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1 inline" />
                      View Students
                    </button>
                    <button
                      onClick={() => addStudentsToClass(classItem)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <UserPlus className="h-4 w-4 mr-1 inline" />
                      Add Students
                    </button>
                  </div>
                  <button
                    onClick={() => manageClass(classItem)}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4 mr-1 inline" />
                    Manage Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Class Modal */}
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClass}
            userSubject={userProfile?.subject}
            existingSubjects={existingSubjects}
          />
        )}

        {/* Students Modal */}
        {showStudentsModal && selectedClass && (
          <StudentsModal
            classData={selectedClass}
            onClose={() => setShowStudentsModal(false)}
          />
        )}

        {/* Add Students Modal */}
        {showAddStudentsModal && selectedClass && (
          <AddStudentsModal
            classData={selectedClass}
            onClose={() => setShowAddStudentsModal(false)}
            onSubmit={async (startId, endId) => {
              try {
                const { data, error } = await dbHelpers.addStudentsToClass(
                  selectedClass.id,
                  startId,
                  endId,
                  currentUser.uid
                );
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success(data.message);
                  setShowAddStudentsModal(false);
                  fetchClasses(); // Refresh classes to update student count
                }
              } catch (error) {
                console.error('Error adding students:', error);
                toast.error('Failed to add students');
              }
            }}
          />
        )}

        {/* Manage Class Modal */}
        {showManageModal && selectedClass && (
          <ManageClassModal
            classData={selectedClass}
            onClose={() => setShowManageModal(false)}
            onUpdate={async (updatedData) => {
              try {
                const { data, error } = await dbHelpers.updateClass(
                  selectedClass.id,
                  updatedData,
                  currentUser.uid
                );
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success('Class updated successfully!');
                  setShowManageModal(false);
                  fetchClasses(); // Refresh classes
                }
              } catch (error) {
                console.error('Error updating class:', error);
                toast.error('Failed to update class');
              }
            }}
            onDelete={async () => {
              try {
                const { data, error } = await dbHelpers.deleteClass(
                  selectedClass.id,
                  currentUser.uid
                );
                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success('Class deleted successfully!');
                  setShowManageModal(false);
                  fetchClasses(); // Refresh classes
                }
              } catch (error) {
                console.error('Error deleting class:', error);
                toast.error('Failed to delete class');
              }
            }}
            existingSubjects={existingSubjects}
          />
        )}
      </div>
    </Layout>
  );
}

// Create Class Modal Component
function CreateClassModal({ onClose, onSubmit, userSubject, existingSubjects }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: userSubject || '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Create New Class</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mathematics 101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <SubjectInput
              value={formData.subject}
              onChange={(value) => setFormData({ ...formData, subject: value })}
              placeholder="e.g., Mathematics, Physics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              existingSubjects={existingSubjects}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Brief description of the class..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Students Modal Component
function StudentsModal({ classData, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const { data, error } = await dbHelpers.getClassStudents(classData.id);
      if (error) {
        toast.error(error.message);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{classData.name}</h3>
            <p className="text-gray-600">Class Code: {classData.class_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No students enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Students Modal Component
function AddStudentsModal({ classData, onClose, onSubmit }) {
  const [startId, setStartId] = useState('');
  const [endId, setEndId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!startId.trim() || !endId.trim()) {
      toast.error('Please enter both start and end student IDs');
      return;
    }

    if (startId > endId) {
      toast.error('Start ID should be less than or equal to End ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(startId.trim(), endId.trim());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add Students to Class</h3>
            <p className="text-gray-600 text-sm">{classData.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <UserPlus className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Bulk Add Students</p>
                <p className="text-xs text-blue-700">Add students by specifying a range of student IDs</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Student ID *
            </label>
            <input
              type="text"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., STU001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Student ID *
            </label>
            <input
              type="text"
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., STU050"
              required
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This will add all students with IDs between {startId || 'START'} and {endId || 'END'} (inclusive) to the class with approved status.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding Students...' : 'Add Students'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Manage Class Modal Component
function ManageClassModal({ classData, onClose, onUpdate, onDelete, existingSubjects }) {
  const [formData, setFormData] = useState({
    name: classData.name || '',
    subject: classData.subject || '',
    description: classData.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleUpdate(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Manage Class</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics 101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <SubjectInput
                value={formData.subject}
                onChange={(value) => setFormData({ ...formData, subject: value })}
                placeholder="e.g., Mathematics, Physics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                existingSubjects={existingSubjects}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description of the class..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2 inline" />
                Delete Class
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Class'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Delete Class</h4>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{classData.name}"? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
