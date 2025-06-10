import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Calendar, Clock, User, Check, X, AlertCircle } from 'lucide-react';

export default function StudentClasses() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchClasses();
    }
  }, [currentUser]);

  async function fetchClasses() {
    try {
      const { data, error } = await dbHelpers.getClassesByStudent(currentUser.uid);
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



  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">My Classes</h1>
                <p className="text-blue-100 text-lg">Manage your enrolled classes and discover new ones</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {classes.length} Enrolled
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <a
                href="/student/browse-classes"
                className="group bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-8 rounded-xl transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                Browse & Join Classes
              </a>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Classes Yet</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Start your learning journey by joining your first class.
                Explore available courses and connect with your teachers.
              </p>
              <div className="space-y-4">
                <a
                  href="/student/browse-classes"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Browse & Join Classes
                </a>
                <p className="text-sm text-gray-500">
                  Discover courses in various subjects and start learning today
                </p>
              </div>
            </div>
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
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                    {getStatusIcon(classItem.status)}
                    <span className="ml-1 capitalize">{classItem.status}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{classItem.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Teacher:</span>
                    <span className="font-medium text-gray-900">{classItem.teacher_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subject:</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      {classItem.subject}
                    </span>
                  </div>

                  {classItem.enrolled_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Joined:</span>
                      <span className="text-gray-700">
                        {new Date(classItem.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {classItem.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                        <Calendar className="h-4 w-4 mr-1 inline" />
                        View Schedule
                      </button>
                      <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                        <Clock className="h-4 w-4 mr-1 inline" />
                        Attendance
                      </button>
                    </div>
                  </div>
                )}

                {classItem.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">Waiting for teacher approval</span>
                      </div>
                    </div>
                  </div>
                )}

                {classItem.status === 'rejected' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <X className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm text-red-800">Join request was rejected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


      </div>
    </Layout>
  );
}



