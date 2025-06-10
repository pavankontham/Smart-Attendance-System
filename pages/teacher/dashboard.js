import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { dbHelpers } from '../../lib/supabase';
import { Users, Calendar, CheckCircle, XCircle, TrendingUp, BarChart3, Award, Target } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendanceRate: 0,
    recentAttendance: [],
    students: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  async function fetchDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all students
      const { data: students } = await dbHelpers.getStudents();
      
      // Get today's attendance
      const { data: todayAttendance } = await dbHelpers.getAllAttendance(today, today);
      
      // Get recent attendance (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: recentAttendance } = await dbHelpers.getAllAttendance(weekAgo, today);
      
      // Calculate stats
      const totalStudents = students?.length || 0;
      const todayPresent = todayAttendance?.filter(record => record.status === 'present').length || 0;
      const todayAbsent = totalStudents - todayPresent;
      
      // Calculate overall attendance rate for the week
      const totalRecords = recentAttendance?.length || 0;
      const presentRecords = recentAttendance?.filter(record => record.status === 'present').length || 0;
      const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
      
      setDashboardData({
        totalStudents,
        todayPresent,
        todayAbsent,
        attendanceRate,
        recentAttendance: recentAttendance?.slice(0, 10) || [],
        students: students || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {userProfile?.name}!
              </h1>
              <p className="text-indigo-100 text-lg">Teacher Dashboard - Manage student attendance</p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">{dashboardData.attendanceRate}% Weekly Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{dashboardData.totalStudents} Students</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {dashboardData.totalStudents}
            </div>
            <div className="text-gray-600 font-medium">Total Students</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {dashboardData.todayPresent}
            </div>
            <div className="text-gray-600 font-medium">Present Today</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {dashboardData.todayAbsent}
            </div>
            <div className="text-gray-600 font-medium">Absent Today</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {dashboardData.attendanceRate}%
            </div>
            <div className="text-gray-600 font-medium">Weekly Rate</div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-gray-900">Present Students</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.todayPresent} / {dashboardData.totalStudents}
              </div>
              <div className="text-sm text-gray-600">
                {dashboardData.totalStudents > 0 
                  ? Math.round((dashboardData.todayPresent / dashboardData.totalStudents) * 100)
                  : 0}% attendance rate
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-gray-900">Absent Students</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {dashboardData.todayAbsent}
              </div>
              <div className="text-sm text-gray-600">
                Students who haven't marked attendance
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/teacher/students" className="group flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Manage Students</div>
                <div className="text-blue-600">View and manage student list</div>
              </div>
            </Link>

            <Link href="/teacher/reports" className="group flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Reports</div>
                <div className="text-green-600">Generate detailed reports</div>
              </div>
            </Link>

            <Link href="/teacher/analytics" className="group flex items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">Analytics</div>
                <div className="text-orange-600">View detailed insights</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance Activity</h2>
          
          {dashboardData.recentAttendance.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    {record.status === 'present' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.users?.name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {record.users?.student_id || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent attendance activity.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
