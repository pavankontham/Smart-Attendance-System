import { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import Layout from '../../src/components/Layout';
import { toast } from 'react-hot-toast';
import { dbHelpers } from '../../src/lib/supabase';
import { BookOpen } from 'lucide-react';

export default function BrowseClasses() {
  const { currentUser, userProfile } = useAuth();
  const [availableClasses, setAvailableClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});

  useEffect(() => {
    console.log('Browse Classes - useEffect triggered:', {
      currentUser: !!currentUser,
      userProfile,
      role: userProfile?.role
    });

    if (currentUser && userProfile?.role === 'student') {
      console.log('Fetching data for student...');
      fetchData();
    } else {
      console.log('Not fetching data - conditions not met');
    }
  }, [currentUser, userProfile]);

  async function fetchData() {
    try {
      setLoading(true);
      console.log('Starting to fetch data...');

      // Fetch available classes
      console.log('Fetching available classes...');
      const { data: availableData, error: availableError } = await dbHelpers.getAvailableClasses();
      console.log('Available classes result:', { availableData, availableError });

      if (availableError) {
        console.error('Error fetching available classes:', availableError);
        if (availableError.message && availableError.message.includes('Failed to fetch')) {
          toast.error('Unable to connect to server. Please make sure the backend is running.');
        } else {
          toast.error('Failed to load available classes: ' + (availableError.message || 'Unknown error'));
        }
        setAvailableClasses([]);
      } else {
        console.log('Setting available classes:', availableData);
        setAvailableClasses(availableData || []);
      }

      // Fetch my enrolled classes
      console.log('Fetching my enrolled classes for user:', currentUser.uid);
      const { data: myData, error: myError } = await dbHelpers.getClassesByStudent(currentUser.uid);
      console.log('My classes result:', { myData, myError });

      if (myError) {
        console.error('Error fetching my classes:', myError);
        if (myError.message && myError.message.includes('Failed to fetch')) {
          toast.error('Unable to connect to server for enrolled classes.');
        } else {
          toast.error('Failed to load your classes: ' + (myError.message || 'Unknown error'));
        }
        setMyClasses([]);
      } else {
        console.log('Setting my classes:', myData);
        setMyClasses(myData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message && error.message.includes('Failed to fetch')) {
        toast.error('Connection error: Please check if the backend server is running on http://localhost:8000');
      } else {
        toast.error('Failed to load classes: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinClass(classId, className) {
    try {
      console.log('Attempting to join class:', { classId, className, userId: currentUser.uid });
      setJoining(prev => ({ ...prev, [classId]: true }));

      const { data, error } = await dbHelpers.joinClass(classId, currentUser.uid);
      console.log('Join class result:', { data, error });

      if (error) {
        console.error('Join class error:', error);
        toast.error(error.message);
      } else {
        console.log('Successfully joined class:', data);
        toast.success(`Successfully joined ${className}!`);
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error joining class:', error);
      toast.error('Failed to join class');
    } finally {
      setJoining(prev => ({ ...prev, [classId]: false }));
    }
  }

  function isAlreadyEnrolled(classId) {
    return myClasses.some(cls => cls.id === classId && cls.status === 'approved');
  }

  if (!currentUser || userProfile?.role !== 'student') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600">This page is only accessible to students.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">Browse Classes</h1>
                <p className="text-green-100 text-lg mb-2">Discover and join new classes to expand your learning</p>
                <div className="flex items-center space-x-4">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {availableClasses.length} Available
                  </span>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {myClasses.length} Enrolled
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-xl transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Classes</h3>
              <p className="text-gray-600">Please wait while we fetch the latest classes for you...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Enrolled Classes */}
            {myClasses.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    My Enrolled Classes
                  </h2>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    {myClasses.length} Classes
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myClasses.map((cls) => (
                    <div key={cls.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all transform hover:scale-105">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                        <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                          ✓ Enrolled
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Subject:</span> {cls.subject}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Teacher:</span> {cls.teacher_name}
                        </p>
                      </div>
                      {cls.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{cls.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-green-200">
                        <div className="text-xs text-gray-500">
                          Joined: {new Date(cls.enrolled_at).toLocaleDateString()}
                        </div>
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Classes */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  Available Classes
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {availableClasses.length} Available
                </span>
              </div>
              {availableClasses.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Available</h3>
                    <p className="text-gray-600 mb-6">
                      There are no classes available at the moment. Check back later or contact your administrator.
                    </p>
                    <button
                      onClick={fetchData}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Refresh Classes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableClasses.map((cls) => {
                    const isEnrolled = isAlreadyEnrolled(cls.id);
                    const isJoining = joining[cls.id];

                    return (
                      <div key={cls.id} className="bg-gradient-to-br from-white to-blue-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 hover:border-blue-300">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{cls.name}</h3>
                          {isEnrolled && (
                            <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                              ✓ Enrolled
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">
                              <span className="font-medium">Subject:</span> {cls.subject}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">
                              <span className="font-medium">Teacher:</span> {cls.teacher_name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">
                              <span className="font-medium">Students:</span> {cls.enrolled_students}
                            </span>
                          </div>
                        </div>

                        {cls.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-3 bg-gray-50 p-3 rounded-lg">{cls.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Created: {new Date(cls.created_at).toLocaleDateString()}
                          </div>

                          {!isEnrolled ? (
                            <button
                              onClick={() => handleJoinClass(cls.id, cls.name)}
                              disabled={isJoining}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
                            >
                              {isJoining ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Joining...
                                </span>
                              ) : (
                                'Join Class'
                              )}
                            </button>
                          ) : (
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

