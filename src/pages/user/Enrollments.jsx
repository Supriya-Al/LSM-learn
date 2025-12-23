import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../lib/api';
import { downloadCertificate } from '../../utils/certificateGenerator';
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Filter,
  PlayCircle,
  Edit,
  Award,
  BarChart3,
  ArrowRight,
  Sparkles,
  Search,
  Trophy,
  Clock as ClockIcon,
  Download,
  Users
} from 'lucide-react';

export const Enrollments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgress, setEditingProgress] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEnrollments();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleProgressUpdate = (event) => {
      fetchEnrollments();
    };
    window.addEventListener('courseProgressUpdated', handleProgressUpdate);
    return () => window.removeEventListener('courseProgressUpdated', handleProgressUpdate);
  }, []);

  const fetchEnrollments = async () => {
    try {
      const { data } = await api.get('/enrollments');
      const enrollmentsData = data || [];
      setEnrollments(enrollmentsData);
      setFilteredEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
      setFilteredEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (enrollmentId, progress) => {
    try {
      const status = progress === 100 ? 'completed' : 'enrolled';
      await api.put(`/enrollments/${enrollmentId}`, {
        progress,
        status,
        completed_at: progress === 100 ? new Date().toISOString() : null,
      });
      await fetchEnrollments();
      setEditingProgress(null);
      if (progress === 100) {
        alert('Congratulations! Course completed! 🎉');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDropCourse = async (enrollmentId, courseTitle) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to drop "${courseTitle}"?\n\n` +
        `This action will mark the course as dropped. You can re-enroll later if needed.\n\n` +
        `This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      await api.put(`/enrollments/${enrollmentId}`, {
        status: 'dropped',
      });

      await fetchEnrollments();
      alert(`Course dropped successfully.\n\n"${courseTitle}" has been marked as dropped.\n\nYou can re-enroll in this course anytime from the Courses page.`);
    } catch (error) {
      console.error('Error dropping course:', error);
      alert('Failed to drop course: ' + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    let filtered = [...enrollments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.course?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(e => {
        const date = new Date(e.completed_at || e.enrolled_at);
        return date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(e => {
        const date = new Date(e.completed_at || e.enrolled_at);
        return date <= new Date(dateRange.end);
      });
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.completed_at || a.enrolled_at;
          const dateB = b.completed_at || b.enrolled_at;
          return new Date(dateB) - new Date(dateA);
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.completed_at || a.enrolled_at;
          const dateB = b.completed_at || b.enrolled_at;
          return new Date(dateA) - new Date(dateB);
        });
        break;
      case 'progress':
        filtered.sort((a, b) => b.progress - a.progress);
        break;
      case 'name':
        filtered.sort((a, b) => (a.course?.title || '').localeCompare(b.course?.title || ''));
        break;
      default:
        break;
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, statusFilter, sortBy, searchQuery, dateRange]);

  const stats = {
    total: enrollments.length,
    enrolled: enrollments.filter(e => e.status === 'enrolled').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length,
    averageProgress: enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0
  };

  const getDaysSinceEnrollment = (enrolledAt) => {
    const enrolled = new Date(enrolledAt);
    const now = new Date();
    const diffTime = Math.abs(now - enrolled);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDuration = (enrollment) => {
    if (!enrollment.completed_at) return null;
    const enrolled = new Date(enrollment.enrolled_at);
    const completed = new Date(enrollment.completed_at);
    const diffTime = Math.abs(completed - enrolled);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0 ? `${months} months, ${days} days` : `${months} months`;
  };

  const getCourseImage = (title) => {
    const courseImages = {
      'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
      'React': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
      'Node.js': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
      'Mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
      'Python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
    };
    
    for (const [key, url] of Object.entries(courseImages)) {
      if (title?.toLowerCase().includes(key.toLowerCase())) {
        return url;
      }
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">My Learning</h1>
              <p className="text-xl text-slate-200">Track your progress and continue your learning journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm font-semibold">Total</span>
              <BookOpen className="w-5 h-5 text-brand-blue" />
            </div>
            <div className="text-3xl font-bold text-text-main">{stats.total}</div>
            <div className="text-text-muted text-xs mt-1">Courses</div>
          </div>

          <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Active</span>
              <PlayCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.enrolled}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0}% active
            </div>
          </div>

          <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Completed</span>
              <Trophy className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% rate
            </div>
          </div>

          <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Dropped</span>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.dropped}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? Math.round((stats.dropped / stats.total) * 100) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Avg Progress</span>
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.averageProgress}%</div>
            <div className="text-gray-500 text-xs mt-1">Overall</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="enrolled">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white font-medium"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="progress">Progress</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredEnrollments.length === 0 ? (
          <div className="bg-surface-card rounded-2xl shadow-card p-16 text-center border border-gray-200">
            <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {enrollments.length === 0 ? 'No Courses Available' : 'No Courses Match Your Search'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {enrollments.length === 0 
                ? "You haven't enrolled in any courses yet. Start your learning journey by exploring our course catalog."
                : "Try adjusting your search or filter criteria."}
            </p>
            {enrollments.length === 0 && (
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold shadow-md"
              >
                <BookOpen className="w-5 h-5" />
                Browse Courses
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEnrollments.map((enrollment, index) => {
              const isCompleted = enrollment.status === 'completed';
              const isDropped = enrollment.status === 'dropped';
              const daysSince = getDaysSinceEnrollment(enrollment.enrolled_at);
              const courseImage = getCourseImage(enrollment.course?.title);

              return (
                <div
                  key={enrollment.id}
                  className="bg-surface-card rounded-2xl shadow-card overflow-hidden border border-gray-200 hover:shadow-card transition-transform duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Course Image */}
                    <div className="md:w-64 h-48 md:h-auto bg-slate-800 flex-shrink-0 relative overflow-hidden">
                      <img 
                        src={courseImage} 
                        alt={enrollment.course?.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      {isCompleted && (
                        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </div>
                      )}
                      {isDropped && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <XCircle className="w-3 h-3" />
                          Dropped
                        </div>
                      )}
                      {!isCompleted && !isDropped && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <PlayCircle className="w-3 h-3" />
                          In Progress
                        </div>
                      )}
                    </div>

                    {/* Course Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-text-main mb-2 hover:text-brand-blue transition-colors">
                            {enrollment.course?.title || 'Unknown Course'}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {enrollment.course?.description || 'No description available'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Course Progress
                          </span>
                          <div className="flex items-center gap-2">
                            {editingProgress === enrollment.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  defaultValue={enrollment.progress}
                                  onBlur={(e) => {
                                    const progress = parseInt(e.target.value) || 0;
                                    handleUpdateProgress(enrollment.id, Math.min(100, Math.max(0, progress)));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const progress = parseInt(e.target.value) || 0;
                                      handleUpdateProgress(enrollment.id, Math.min(100, Math.max(0, progress)));
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingProgress(null);
                                    }
                                  }}
                                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                  autoFocus
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">{enrollment.progress}%</span>
                                {!isCompleted && !isDropped && (
                                  <button
                                    onClick={() => setEditingProgress(enrollment.id)}
                                    className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Edit progress"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
                              isCompleted
                                ? 'bg-brand-orange'
                                : enrollment.progress >= 50
                                ? 'bg-brand-blue'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${enrollment.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Enrolled</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDate(enrollment.enrolled_at)}
                            </p>
                          </div>
                        </div>
                        {enrollment.completed_at && (
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <Trophy className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Completed</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(enrollment.completed_at)}
                              </p>
                            </div>
                          </div>
                        )}
                        {getDuration(enrollment) && (
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <ClockIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Duration</p>
                              <p className="text-sm font-semibold text-gray-900">{getDuration(enrollment)}</p>
                            </div>
                          </div>
                        )}
                        {!enrollment.completed_at && (
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Days Active</p>
                              <p className="text-sm font-semibold text-gray-900">{daysSince} days</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                        {!isCompleted && !isDropped && (
                          <>
                            {/* Primary action */}
                            <button 
                              onClick={() => navigate(`/courses/${enrollment.course_id}`)}
                              className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold shadow-md"
                            >
                              <PlayCircle className="w-5 h-5" />
                              Continue Learning
                              <ArrowRight className="w-5 h-5" />
                            </button>
                            {/* Destructive / secondary */}
                            <button 
                              onClick={() => handleDropCourse(enrollment.id, enrollment.course?.title || 'Course')}
                              className="flex items-center gap-2 px-6 py-3 border border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-semibold"
                            >
                              <XCircle className="w-5 h-5" />
                              Drop Course
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <button 
                            onClick={async () => {
                              try {
                                const { data } = await api.get(`/certificates/${enrollment.course_id}`);
                                if (data.eligible && data.certificateData) {
                                  downloadCertificate(data.certificateData);
                                } else {
                                  alert('Certificate is not yet available.');
                                }
                              } catch (error) {
                                alert(`Unable to generate certificate: ${error.response?.data?.error || error.message}`);
                              }
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold shadow-md"
                          >
                            <Download className="w-5 h-5" />
                            Download Certificate
                          </button>
                        )}
                        {isDropped && (
                        <button 
                            onClick={() => navigate('/courses')}
                          className="flex items-center gap-2 px-6 py-3 border border-brand-orange text-brand-orange rounded-xl hover:bg-orange-50 transition-colors font-semibold"
                          >
                            <BookOpen className="w-5 h-5" />
                            Re-enroll
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/courses/${enrollment.course_id}`)}
                          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                        >
                          <BookOpen className="w-5 h-5" />
                          View Course
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
