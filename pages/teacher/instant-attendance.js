import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { Clock, Users, Key, RefreshCw, CheckCircle, XCircle, Timer, Copy } from 'lucide-react';

export default function InstantAttendance() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [instantPassword, setInstantPassword] = useState('');
  const [passwordExpiry, setPasswordExpiry] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchClasses();
    }
  }, [currentUser]);

  // Timer for password expiry
  useEffect(() => {
    let interval;
    if (passwordExpiry) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max(0, passwordExpiry - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          // Invalidate password on backend when timer expires
          if (instantPassword) {
            invalidatePassword(instantPassword);
          }
          setInstantPassword('');
          setPasswordExpiry(null);
          toast('Instant password has expired', { icon: 'ℹ️' });
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [passwordExpiry]);

  async function fetchClasses() {
    try {
      const { data, error } = await dbHelpers.getClassesByTeacher(currentUser.uid);
      if (error) {
        toast.error(error.message);
      } else {
        setClasses(data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }

  async function generateInstantPassword() {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    try {
      // Call backend API to generate password
      const { data, error } = await dbHelpers.generateInstantPassword(
        selectedClass.id,
        1, // slot number (default to 1)
        currentUser.uid
      );

      if (error) {
        toast.error(error.message || 'Failed to generate password');
        return;
      }

      if (data && data.password) {
        const expiry = new Date(data.expires_at).getTime();

        setInstantPassword(data.password);
        setPasswordExpiry(expiry);
        setTimeRemaining(expiry - new Date().getTime());

        toast.success('Instant password generated! Valid for 3 minutes.');
      } else {
        toast.error('Failed to generate password');
      }
    } catch (error) {
      console.error('Error generating password:', error);
      toast.error('Failed to generate password. Please try again.');
    }
  }

  function copyPassword() {
    if (instantPassword) {
      navigator.clipboard.writeText(instantPassword);
      toast.success('Password copied to clipboard!');
    }
  }

  async function invalidatePassword(password) {
    try {
      await dbHelpers.invalidateInstantPassword(password, currentUser.uid);
    } catch (error) {
      console.error('Error invalidating password:', error);
    }
  }

  function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async function markAttendanceManually(studentId, status) {
    try {
      const { error } = await dbHelpers.markAttendance({
        student_firebase_id: studentId,
        class_id: selectedClass.id,
        status: status,
        marked_by: 'teacher',
        teacher_firebase_id: currentUser.uid
      });

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('already marked')) {
          errorMessage = 'Attendance already marked for this student today.';
        } else if (errorMessage.includes('Student not found')) {
          errorMessage = 'Student not found. Please refresh the page and try again.';
        } else if (errorMessage.includes('not enrolled')) {
          errorMessage = 'Student is not enrolled in this class.';
        } else if (errorMessage.includes('permission')) {
          errorMessage = 'You don\'t have permission to mark attendance for this class.';
        } else if (errorMessage.includes('Database connection')) {
          errorMessage = 'Connection error. Please try again in a moment.';
        }
        toast.error(errorMessage);
      } else {
        toast.success(`Attendance marked as ${status}`);
        fetchAttendanceData();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      let errorMessage = 'Failed to mark attendance. Please try again.';

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

  async function fetchAttendanceData() {
    if (!selectedClass) return;

    try {
      const { data, error } = await dbHelpers.getClassStudents(selectedClass.id);
      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('Class not found')) {
          errorMessage = 'Class not found. Please refresh the page and try again.';
        } else if (errorMessage.includes('permission')) {
          errorMessage = 'You don\'t have permission to view this class data.';
        } else if (errorMessage.includes('Database connection')) {
          errorMessage = 'Connection error. Please try again in a moment.';
        }
        toast.error(errorMessage);
      } else if (data) {
        setAttendanceData(data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      let errorMessage = 'Failed to load attendance data. Please try again.';

      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again in a moment.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }

      toast.error(errorMessage);
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceData();
    }
  }, [selectedClass]);

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
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Timer className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Instant Attendance</h1>
              <p className="text-green-100 text-lg">Generate temporary passwords for quick attendance marking</p>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Class</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => setSelectedClass(classItem)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedClass?.id === classItem.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                <p className="text-sm text-gray-600">{classItem.subject}</p>
                <p className="text-xs text-gray-500 mt-1">{classItem.student_count || 0} students</p>
              </button>
            ))}
          </div>
        </div>

        {/* Password Generation */}
        {selectedClass && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Instant Password</h2>
              <div className="text-sm text-gray-600">
                Class: <span className="font-medium">{selectedClass.name}</span>
              </div>
            </div>

            {!instantPassword ? (
              <div className="text-center py-8">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Instant Password</h3>
                <p className="text-gray-600 mb-6">
                  Create a 6-digit password that students can use to mark attendance for the next 3 minutes
                </p>
                <button
                  onClick={generateInstantPassword}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  <Key className="h-5 w-5 mr-2 inline" />
                  Generate Password
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-6">
                  <div className="text-4xl font-bold text-green-600 mb-2 font-mono tracking-wider">
                    {instantPassword}
                  </div>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={copyPassword}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-1 inline" />
                      Copy
                    </button>
                    <div className="text-green-700 font-medium">
                      <Clock className="h-4 w-4 mr-1 inline" />
                      {formatTime(timeRemaining)} remaining
                    </div>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeRemaining / (3 * 60 * 1000)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={generateInstantPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 inline" />
                    Generate New
                  </button>
                  <button
                    onClick={async () => {
                      // Invalidate password on backend when stop session is clicked
                      if (instantPassword) {
                        await invalidatePassword(instantPassword);
                      }
                      setInstantPassword('');
                      setPasswordExpiry(null);
                      setTimeRemaining(0);
                      toast.success('Session stopped and password invalidated');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2 inline" />
                    Stop Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Attendance */}
        {selectedClass && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Attendance</h2>
            <p className="text-gray-600 mb-6">Mark attendance manually for students in this class</p>
            
            {attendanceData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No students enrolled in this class</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceData.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.student_id}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markAttendanceManually(student.firebase_id, 'present')}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-1 inline" />
                        Present
                      </button>
                      <button
                        onClick={() => markAttendanceManually(student.firebase_id, 'absent')}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-1 inline" />
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

