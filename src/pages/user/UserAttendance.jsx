import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  TrendingUp, 
  Download, 
  PieChart, 
  Plus, 
  X,
  Award,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';

export const UserAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [isFromQuizCompletion, setIsFromQuizCompletion] = useState(false);
  const [markForm, setMarkForm] = useState({
    course_id: '',
    session: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkInTime: '',
    checkOutTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchAttendance();
    fetchEnrollments();
  }, []);

  useEffect(() => {
    if (location.state && location.state.fromCourseDetail) {
      const { courseId, session, date, checkInTime, checkOutTime, dayNumber, courseTitle } = location.state;
      setIsFromQuizCompletion(true);
      setShowMarkModal(true);
      setMarkForm((prev) => ({
        ...prev,
        course_id: courseId || '',
        session: session || '',
        date: date || new Date().toISOString().split('T')[0],
        checkInTime: checkInTime !== undefined ? checkInTime : prev.checkInTime,
        checkOutTime: checkOutTime !== undefined ? checkOutTime : prev.checkOutTime,
        status: 'present',
      }));
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchAttendance = async () => {
    try {
      const params = {};
      if (filter) params.course_id = filter;
      const { data } = await api.get('/attendance', { params });
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data } = await api.get('/enrollments');
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filter]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!markForm.course_id || !markForm.session || !markForm.date || !markForm.status) {
      alert('Please fill in all required fields (course, session, date, status)');
      return;
    }

    if (!isFromQuizCompletion) {
      const usedSessions = getUsedSessionsForCourse(markForm.course_id);
      if (usedSessions.has(markForm.session)) {
        alert(`You have already marked ${markForm.session} for this course.`);
        return;
      }

      const selectedDay = parseDayNumber(markForm.session);
      const nextAllowed = getNextAllowedDayForCourse(markForm.course_id);
      if (selectedDay !== null && selectedDay !== nextAllowed) {
        alert(`You can only mark Day ${nextAllowed} next for this course.`);
        return;
      }
    }

    const pieces = [];
    if (markForm.session) {
      pieces.push(`Session: ${markForm.session}`);
    }
    const timeNotes = [];
    if (markForm.checkInTime) {
      timeNotes.push(`Check-in: ${markForm.checkInTime}`);
    }
    if (markForm.checkOutTime) {
      timeNotes.push(`Check-out: ${markForm.checkOutTime}`);
    }
    const extraNotes = markForm.notes?.trim() || '';
    const combinedNotes = [
      pieces.join(' | '),
      timeNotes.join(' | '),
      extraNotes
    ]
      .filter(Boolean)
      .join(' | ');

    const payload = {
      course_id: markForm.course_id,
      session: markForm.session,
      date: markForm.date,
      status: markForm.status,
      notes: combinedNotes || null,
    };

    setMarkingAttendance(true);
    try {
      const response = await api.post('/attendance', payload);
      const successMessage = response.data.updated 
        ? 'Attendance updated successfully!' 
        : 'Attendance marked successfully!';
      
      setShowMarkModal(false);
      setMarkForm({
        course_id: '',
        session: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkInTime: '',
        checkOutTime: '',
        notes: ''
      });
      await fetchAttendance();

      window.dispatchEvent(new CustomEvent('courseProgressUpdated', {
        detail: { courseId: markForm.course_id }
      }));

      localStorage.setItem('courseProgressLastUpdate', Date.now().toString());

      if (isFromQuizCompletion && markForm.course_id) {
        const dayNum = parseDayNumber(markForm.session);
        alert(`✅ ${successMessage}\n\n🎉 Day ${dayNum || 'completed'} is now fully completed!\n\nReturning to course...`);
        setIsFromQuizCompletion(false);
        navigate(`/courses/${markForm.course_id}`);
      } else {
        alert(successMessage);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark attendance';
      alert(errorMessage);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const getUsedSessionsForCourse = (courseId) => {
    if (!courseId) return new Set();
    const used = new Set();
    attendance.forEach((record) => {
      if (record.course_id === courseId && record.notes) {
        const match = record.notes.match(/Session:\s*(Day\s*\d+)/i);
        if (match && match[1]) {
          used.add(match[1].trim());
        }
      }
    });
    return used;
  };

  const parseDayNumber = (sessionLabel) => {
    if (!sessionLabel) return null;
    const match = sessionLabel.match(/Day\s*(\d+)/i);
    if (!match || !match[1]) return null;
    const num = parseInt(match[1], 10);
    return Number.isNaN(num) ? null : num;
  };

  const getNextAllowedDayForCourse = (courseId) => {
    const used = getUsedSessionsForCourse(courseId);
    if (used.size === 0) return 1;
    let maxDay = 0;
    used.forEach((label) => {
      const n = parseDayNumber(label);
      if (n && n > maxDay) maxDay = n;
    });
    return maxDay + 1;
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
    attendanceRate: attendance.length > 0 
      ? ((attendance.filter((a) => a.status === 'present' || a.status === 'excused').length / attendance.length) * 100).toFixed(1)
      : 0
  };

  const courseStats = {
    totalCourses: enrollments.length,
    activeCourses: enrollments.filter((e) => e.status !== 'dropped').length,
    completedCourses: enrollments.filter((e) => e.status === 'completed').length,
    avgProgress: enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        )
      : 0,
  };

  const attendanceByCourse = attendance.filter((record) => {
    if (dateFilter) {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      if (recordDate !== dateFilter) return false;
    }
    if (statusFilter && record.status !== statusFilter) return false;
    return true;
  }).reduce((acc, record) => {
    const courseTitle = record.course?.title || 'Unknown Course';
    if (!acc[courseTitle]) {
      acc[courseTitle] = {
        course: record.course,
        records: [],
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0
      };
    }
    acc[courseTitle].records.push(record);
    acc[courseTitle][record.status]++;
    acc[courseTitle].total++;
    return acc;
  }, {});

  const courses = [...new Set(attendance.map((a) => a.course?.title).filter(Boolean))];

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      excused: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const exportAttendanceToCSV = () => {
    const filtered = attendance.filter((record) => {
      if (dateFilter) {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        if (recordDate !== dateFilter) return false;
      }
      if (statusFilter && record.status !== statusFilter) return false;
      return true;
    });

    const headers = ['Course', 'Date', 'Status', 'Notes'];
    const rows = filtered.map(record => [
      record.course?.title || '',
      formatDate(record.date),
      record.status,
      record.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Your Progress</h1>
              <p className="text-xl text-slate-200">Track your attendance and course completion progress</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMarkModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Mark Attendance
              </button>
              <button
                onClick={exportAttendanceToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-orange-100 text-sm font-semibold">Avg Progress</span>
              <TrendingUp className="w-6 h-6 opacity-80" />
            </div>
            <div className="text-3xl font-bold">{courseStats.avgProgress}%</div>
            <div className="text-orange-100 text-xs mt-1">
              {courseStats.completedCourses} of {courseStats.totalCourses} completed
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Present</span>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.present}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Absent</span>
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.absent}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-semibold">Late/Excused</span>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.late + stats.excused}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.late} late, {stats.excused} excused
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white font-medium"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              />
            </div>
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white font-medium"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            {(dateFilter || statusFilter) && (
              <button
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('');
                }}
                className="px-6 py-3 text-sm text-gray-600 hover:text-gray-900 font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course-wise Summary */}
      {Object.keys(attendanceByCourse).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl shadow-lg">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Progress by Course</h2>
                <p className="text-sm text-gray-500">Attendance breakdown by course</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(attendanceByCourse).map(([courseTitle, data]) => {
                const courseRate = data.total > 0 
                  ? ((data.present + data.excused) / data.total * 100).toFixed(1)
                  : 0;
                return (
                  <div key={courseTitle} className="border-2 border-gray-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-base line-clamp-1">{courseTitle}</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">{courseRate}%</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-semibold text-gray-900">{data.present}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-semibold text-gray-900">{data.absent}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-semibold">Total:</span>
                        <span className="font-bold text-gray-900">{data.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Records</h2>
            <p className="text-sm text-gray-600">
              Showing {Object.keys(attendanceByCourse).length > 0 ? Object.values(attendanceByCourse).reduce((sum, data) => sum + data.total, 0) : 0} of {attendance.length} records
            </p>
          </div>
          {Object.keys(attendanceByCourse).length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Progress Records</h3>
              <p className="text-gray-500 mb-6">
                {attendance.length === 0 
                  ? "You don't have any progress records yet."
                  : "No records match your current filters."}
              </p>
              <button
                onClick={() => setShowMarkModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Mark Attendance
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(attendanceByCourse)
                    .flatMap(data => data.records)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((record) => (
                      <tr key={record.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {record.course?.title || 'Unknown Course'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {record.session || (() => {
                              const match = record.notes?.match(/Session:\s*(Day\s*\d+)/i);
                              return match ? match[1] : '-';
                            })()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{formatDate(record.date)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{record.notes || '-'}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-blue-900 text-white px-8 py-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold">Mark Attendance</h2>
              <button
                onClick={() => {
                  setShowMarkModal(false);
                  setIsFromQuizCompletion(false);
                  setMarkForm({
                    course_id: '',
                    session: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'present',
                    checkInTime: '',
                    checkOutTime: '',
                    notes: ''
                  });
                }}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMarkAttendance} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={markForm.course_id}
                  onChange={(e) => setMarkForm({ ...markForm, course_id: e.target.value })}
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                >
                  <option value="">Select a course</option>
                  {enrollments
                    .filter(e => e.course && e.status === 'enrolled')
                    .map((enrollment) => (
                      <option key={enrollment.course_id} value={enrollment.course_id}>
                        {enrollment.course.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={markForm.session}
                  onChange={(e) => setMarkForm({ ...markForm, session: e.target.value })}
                  required
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                >
                  <option value="">Select a session</option>
                  {(() => {
                    const used = getUsedSessionsForCourse(markForm.course_id);
                    const nextAllowed = getNextAllowedDayForCourse(markForm.course_id);
                    return Array.from({ length: 30 }, (_, i) => {
                      const dayNum = i + 1;
                      const label = `Day ${dayNum}`;
                      const isUsed = used.has(label);
                      const disabled = isUsed || dayNum !== nextAllowed;
                      let note = '';
                      if (isUsed) note = ' (already marked)';
                      else if (dayNum !== nextAllowed) note = ' (locked)';
                      return (
                        <option key={label} value={label} disabled={disabled}>
                          {label}
                          {note}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={markForm.date}
                  onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    value={markForm.checkInTime}
                    onChange={(e) => setMarkForm({ ...markForm, checkInTime: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    value={markForm.checkOutTime}
                    onChange={(e) => setMarkForm({ ...markForm, checkOutTime: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'present', label: 'Present', icon: CheckCircle, color: 'green' },
                    { value: 'absent', label: 'Absent', icon: XCircle, color: 'red' },
                    { value: 'late', label: 'Late', icon: Clock, color: 'yellow' },
                    { value: 'excused', label: 'Excused', icon: AlertCircle, color: 'blue' }
                  ].map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMarkForm({ ...markForm, status: value })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-semibold ${
                        markForm.status === value
                          ? `border-${color}-500 bg-${color}-50 text-${color}-900`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        markForm.status === value ? `text-${color}-600` : 'text-gray-400'
                      }`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={markForm.notes}
                  onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkModal(false);
                    setIsFromQuizCompletion(false);
                    setMarkForm({
                      course_id: '',
                      date: new Date().toISOString().split('T')[0],
                      status: 'present',
                      checkInTime: '',
                      checkOutTime: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingAttendance}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAttendance ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
