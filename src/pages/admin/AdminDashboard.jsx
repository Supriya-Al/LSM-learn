import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, GraduationCap, Activity, TrendingUp, ArrowRight, Award, Shield } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeCourses: 0,
  });
  const [courseStats, setCourseStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes, enrollmentsRes, analyticsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/courses'),
        api.get('/enrollments'),
        api.get('/analytics/courses'),
      ]);

      setStats({
        totalUsers: usersRes.data.length,
        totalCourses: coursesRes.data.length,
        totalEnrollments: enrollmentsRes.data.length,
        activeCourses: coursesRes.data.filter(c => c.status === 'active').length,
      });
      setCourseStats(analyticsRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-600 to-blue-800',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
    },
    {
      label: 'Enrollments',
      value: stats.totalEnrollments,
      icon: GraduationCap,
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Active Courses',
      value: stats.activeCourses,
      icon: Activity,
      gradient: 'from-slate-700 to-slate-900',
      bgGradient: 'from-slate-50 to-slate-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
                <Shield className="w-3 h-3 mr-2" />
                Admin Portal
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-xl text-slate-200">Overview of your learning management system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-br ${stat.bgGradient} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Course Enrollments</h2>
                <p className="text-sm text-gray-500">Top courses by enrollment</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="course_title" angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Bar dataKey="total_enrollments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Course Completion</h2>
                <p className="text-sm text-gray-500">Completion rates by course</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseStats.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ course_title, completed }) => `${course_title}: ${completed}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="completed"
                >
                  {courseStats.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-3 rounded-xl shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-500">Manage your LMS quickly</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/admin/users"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-600 transition-all duration-300">
                  <Users className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Manage Users</h3>
              <p className="text-sm text-gray-600">View and edit user accounts</p>
            </Link>
            <Link
              to="/admin/courses"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-orange-50/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-4 rounded-xl group-hover:bg-orange-600 transition-all duration-300">
                  <BookOpen className="w-7 h-7 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Manage Courses</h3>
              <p className="text-sm text-gray-600">Create and edit courses</p>
            </Link>
            <Link
              to="/admin/attendance"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-600 transition-all duration-300">
                  <Activity className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Mark Attendance</h3>
              <p className="text-sm text-gray-600">Record student attendance</p>
            </Link>
            <Link
              to="/admin/reports"
              className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-orange-50/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-4 rounded-xl group-hover:bg-orange-600 transition-all duration-300">
                  <TrendingUp className="w-7 h-7 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">View Reports</h3>
              <p className="text-sm text-gray-600">Generate and export reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
