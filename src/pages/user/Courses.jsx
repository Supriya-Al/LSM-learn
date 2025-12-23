import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  BookOpen, 
  CheckCircle, 
  Users, 
  Search, 
  Filter, 
  Star, 
  Clock,
  PlayCircle,
  Award,
  TrendingUp,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

export const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/public/courses').catch(err => {
          console.error('Courses API error:', err);
          return { data: [] };
        }),
        api.get('/enrollments').catch(err => {
          console.error('Enrollments API error:', err);
          return { data: [] };
        }),
      ]);
      
      const coursesData = coursesRes.data || [];
      const enrollmentsData = enrollmentsRes.data || [];
      
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      setEnrollments(enrollmentsData.map((e) => e.course_id));
    } catch (error) {
      console.error('Error fetching data:', error);
      setCourses([]);
      setFilteredCourses([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...courses];

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredCourses(filtered);
  }, [searchQuery, sortBy, courses]);

  const handleEnroll = async (courseId) => {
    try {
      const response = await api.post('/enrollments', { course_id: courseId });
      await fetchData();
      navigate('/enrollments');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course: ' + (error.response?.data?.error || error.message));
    }
  };

  const getEnrollmentCount = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.enrollment_count || 0;
  };

  const formatEnrollmentCount = (count) => {
    if (count >= 100000) {
      return `${(count / 100000).toFixed(1)}L+`;
    } else if (count >= 10000) {
      return `${(count / 1000).toFixed(0)}K+`;
    }
    return `${count}+`;
  };

  const getCourseImage = (title) => {
    const courseImages = {
      'Web Development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
      'React': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
      'Node.js': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
      'Database': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop',
      'Python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop',
      'UI/UX': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
      'DevOps': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
      'Mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
      'AWS': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
      'Full Stack': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
    };
    
    for (const [key, url] of Object.entries(courseImages)) {
      if (title.toLowerCase().includes(key.toLowerCase())) {
        return url;
      }
    }
    
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-pulse">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Section - Dark Blue with Orange Accents */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-orange-500/20 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
              <Award className="w-3 h-3 mr-2" />
              Expert-Led Courses
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Discover Your Next{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h1>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
              Master new skills with our comprehensive courses taught by industry experts. 
              Start your learning journey today and unlock your potential.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2 border border-white/20">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for courses, skills, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-medium"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-12 pr-10 py-4 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white font-semibold cursor-pointer min-w-[180px]"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              All Courses
            </h2>
            <p className="text-gray-600 text-lg">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
            </p>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
              <BookOpen className="w-24 h-24 text-gray-300 mx-auto relative" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {courses.length === 0 ? 'No Courses Available' : 'No Courses Match Your Search'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {courses.length === 0 
                ? "There are no courses available yet. Please check back later or contact an administrator."
                : "Try adjusting your search or filter criteria."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
              >
                Clear Search
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, index) => {
              const isEnrolled = enrollments.includes(course.id);
              const enrollmentCount = getEnrollmentCount(course.id);
              const courseImage = getCourseImage(course.title);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
                    <img 
                      src={courseImage} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    
                    {/* Badge */}
                    {isEnrolled && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Enrolled
                      </div>
                    )}
                    
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/95 backdrop-blur-sm rounded-full p-5 shadow-2xl transform group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-14 h-14 text-orange-600" fill="currentColor" />
                      </div>
                    </div>

                    {/* Course Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 text-white text-xs font-semibold">
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatEnrollmentCount(enrollmentCount)}
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          4.5
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    {/* Course Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">
                      {course.title}
                    </h3>
                    
                    {/* Course Description */}
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed min-h-[4.5rem]">
                      {course.description || 'Master this skill with our comprehensive course designed by industry experts'}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">7 days</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Beginner</span>
                      </div>
                    </div>

                    {/* Enroll Button */}
                    <button
                      onClick={() => {
                        if (isEnrolled) {
                          navigate(`/courses/${course.id}`);
                        } else {
                          handleEnroll(course.id);
                        }
                      }}
                      className={`w-full px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
                        isEnrolled
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105'
                          : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:shadow-xl transform hover:scale-105'
                      }`}
                    >
                      {isEnrolled ? (
                        <span className="flex items-center justify-center gap-2">
                          <PlayCircle className="w-5 h-5" />
                          Continue Learning
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Enroll Now
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
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
