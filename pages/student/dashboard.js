import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { dbHelpers } from '../../lib/supabase';
import { Calendar, Camera, CheckCircle, XCircle, Clock, User, TrendingUp, Award, Target, Timer } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { userProfile, currentUser } = useAuth();
  const [attendanceData, setAttendanceData] = useState({
    today: null,
    thisWeek: [],
    thisMonth: [],
    stats: {
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    }
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile && currentUser) {
      fetchAttendanceData();
      fetchProfilePhoto();
    }
  }, [userProfile, currentUser]);

  async function fetchAttendanceData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get today's attendance - Use Firebase ID (currentUser.uid) instead of database ID
      const { data: todayData } = await dbHelpers.getAttendanceByUser(currentUser.uid, today, today);

      // Get this week's attendance
      const { data: weekData } = await dbHelpers.getAttendanceByUser(currentUser.uid, weekAgo, today);

      // Get this month's attendance
      const { data: monthData } = await dbHelpers.getAttendanceByUser(currentUser.uid, monthAgo, today);

      // Calculate stats
      const presentDays = monthData?.filter(record => record.status === 'present').length || 0;
      const totalDays = monthData?.length || 0;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      setAttendanceData({
        today: todayData?.[0] || null,
        thisWeek: weekData || [],
        thisMonth: monthData || [],
        stats: {
          present: presentDays,
          absent: totalDays - presentDays,
          total: totalDays,
          percentage
        }
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {profilePhoto ? (
                <div className="relative">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <User className="h-10 w-10 text-white/80" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {userProfile?.name}!
              </h1>
              <p className="text-blue-100 text-lg">Student ID: {userProfile?.student_id}</p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm">Attendance Champion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <span className="text-sm">{attendanceData.stats.percentage.toFixed(1)}% This Month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Status */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-blue-600" />
            Today's Attendance
          </h2>
          {attendanceData.today ? (
            <div className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-lg font-semibold text-green-800">Present</p>
                <p className="text-green-600">
                  Marked at {new Date(attendanceData.today.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">✓</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-lg font-semibold text-red-800">Not Marked</p>
                <p className="text-red-600">You haven't marked attendance today</p>
              </div>
              <div className="text-right">
                <Link href="/student/instant-attendance" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Mark Now
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {attendanceData.stats.present}
            </div>
            <div className="text-gray-600 font-medium">Present Days</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {attendanceData.stats.absent}
            </div>
            <div className="text-gray-600 font-medium">Absent Days</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {attendanceData.stats.total}
            </div>
            <div className="text-gray-600 font-medium">Total Days</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {attendanceData.stats.percentage}%
            </div>
            <div className="text-gray-600 font-medium">Attendance Rate</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/student/instant-attendance" className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Quick Attendance</div>
                <div className="text-blue-600">Use teacher's code</div>
              </div>
            </Link>

            <Link href="/student/history" className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">View History</div>
                <div className="text-green-600">Check past attendance</div>
              </div>
            </Link>

            <Link href="/student/enroll" className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Manage Face</div>
                <div className="text-purple-600">Enroll or view your face</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance</h2>
          {attendanceData.thisWeek.length > 0 ? (
            <div className="space-y-2">
              {attendanceData.thisWeek.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    {record.status === 'present' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <span className="font-medium">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {record.timestamp && new Date(record.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No attendance records found.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
