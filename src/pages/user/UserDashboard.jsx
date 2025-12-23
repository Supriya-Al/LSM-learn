import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Bell, 
  ArrowRight, 
  Shield,
  PlayCircle,
  Award,
  Users,
  Clock
} from 'lucide-react';

export const UserDashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    recentEnrollments: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationError, setNotificationError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleProgressUpdate = (event) => {
      fetchData();
    };
    window.addEventListener('courseProgressUpdated', handleProgressUpdate);
    return () => window.removeEventListener('courseProgressUpdated', handleProgressUpdate);
  }, []);

  const fetchData = async () => {
    try {
      const [enrollmentsRes, notificationsRes] = await Promise.all([
        api.get('/enrollments').catch(err => {
          return { data: [] };
        }),
        api.get('/notifications').then(res => {
          setNotificationError(null);
          return res;
        }).catch(err => {
          let errorMsg = 'Failed to load notifications';
          if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
            errorMsg = 'Backend server not accessible. Please check if server is running.';
          } else if (err.response?.status === 401) {
            errorMsg = 'Unauthorized. Please sign in again.';
          } else if (err.response?.status === 500) {
            errorMsg = 'Server error. Please check backend logs.';
          } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error;
          }
          setNotificationError(errorMsg);
          return { data: [] };
        }),
      ]);

      const enrollments = enrollmentsRes.data || [];
      const notifications = notificationsRes.data || [];

      const completed = enrollments.filter((e) => e.status === 'completed').length;
      const avgProgress =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            )
          : 0;

      setStats({
        enrolledCourses: enrollments.length,
        completedCourses: completed,
        averageProgress: avgProgress,
        recentEnrollments: enrollments.slice(0, 4),
      });
      
      const notificationsArray = Array.isArray(notifications) ? notifications : [];
      setNotifications(notificationsArray.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
      setStats({
        enrolledCourses: 0,
        completedCourses: 0,
        averageProgress: 0,
        recentEnrollments: [],
      });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      iconBg: 'bg-brand-blue-soft',
    },
    {
      label: 'Completed Courses',
      value: stats.completedCourses,
      icon: CheckCircle,
      iconBg: 'bg-brand-orange-soft',
    },
    {
      label: 'Average Progress',
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      iconBg: 'bg-blue-100',
    },
  ];

  // Get course image
  const getCourseImage = (title) => {
    const courseImages = {
      'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
      'React': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
      'Node.js': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
      'Mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
    };
    
    for (const [key, url] of Object.entries(courseImages)) {
      if (title?.toLowerCase().includes(key.toLowerCase())) {
        return url;
      }
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop';
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section - Dark Blue with Orange Accents */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-orange-500/20 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
                <Award className="w-3 h-3 mr-2" />
                Expert-led Programs
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                Welcome Back!{' '}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Continue Learning
                </span>
              </h1>
              <p className="text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
                Master in-demand professional skills and accelerate your career growth with our comprehensive learning platform.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Primary CTA – solid, slightly muted orange */}
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 bg-brand-orange text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-md"
                >
                  <BookOpen className="w-5 h-5" />
                  Explore Courses
                  <ArrowRight className="w-5 h-5" />
                </Link>
                {/* Secondary CTA – subtle outline */}
                <Link
                  to="/enrollments"
                  className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  My Learning
                </Link>
              </div>
            </div>
            {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white border border-white/30 font-semibold hover:bg-white/20 transition-colors"
            >
                <Shield className="w-5 h-5" />
                Admin Portal
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-surface-card rounded-2xl shadow-card overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-text-main">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                      <Icon className="w-7 h-7 text-brand-blue" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enrollments */}
          <div className="bg-surface-card rounded-2xl shadow-card p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
                  <p className="text-sm text-gray-500">Your active courses</p>
                </div>
              </div>
              <Link
                to="/enrollments"
                className="text-sm text-brand-blue hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recentEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto relative" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1 font-medium">No enrollments yet</p>
                  <p className="text-xs text-gray-400 mb-6">Start your learning journey by enrolling in courses</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Courses
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                stats.recentEnrollments.map((enrollment, idx) => {
                  const courseImage = getCourseImage(enrollment.course?.title);
                  return (
                    <div
                      key={enrollment.id}
                      className="group relative border border-gray-200 rounded-xl overflow-hidden hover:border-brand-blue-soft hover:shadow-card transition-all duration-200 bg-surface-card"
                      onClick={() => navigate(`/courses/${enrollment.course_id}`)}
                    >
                      <div className="flex">
                        <div className="w-32 h-24 bg-slate-800 flex-shrink-0 relative overflow-hidden">
                          <img 
                            src={courseImage} 
                            alt={enrollment.course?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <PlayCircle className="w-6 h-6 text-white opacity-90" />
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 flex-1 pr-2">
                              {enrollment.course?.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                enrollment.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {enrollment.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-blue-500" />
                              {enrollment.progress}%
                            </span>
                          </div>
                          <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                enrollment.progress === 100
                                  ? 'bg-brand-orange'
                                  : 'bg-brand-blue'
                              }`}
                              style={{ width: `${enrollment.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-500">Latest updates</p>
                </div>
                {notifications.length > 0 && (
                  <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {notificationError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
                  <p className="font-semibold text-sm">Error loading notifications</p>
                  <p className="text-xs">{notificationError}</p>
                </div>
              )}
              {notifications.length === 0 && !notificationError ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No notifications</p>
                  <p className="text-xs text-gray-400 mt-2">Notifications will appear here when you receive updates</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification, idx) => (
                  <div
                    key={notification.id}
                    className={`group relative p-4 rounded-xl border-l-4 transition-all duration-300 hover:shadow-md cursor-pointer ${
                      !notification.read 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-500 shadow-sm' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                        !notification.read ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-bold text-sm ${
                            !notification.read ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
