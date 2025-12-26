import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { format } from 'date-fns';
import { FileText, Download, Filter, Calendar, BookOpen, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const Reports = () => {
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    course_id: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.course_id) params.append('course_id', filters.course_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const { data } = await api.get(`/reports/attendance?${params.toString()}`);
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Student', 'Course', 'Date', 'Status', 'Notes'].join(','),
      ...attendance.map((record) =>
        [
          record.user?.full_name || record.user?.email,
          record.course?.title,
          record.date,
          record.status,
          `"${(record.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 mb-6 backdrop-blur-sm">
                <FileText className="w-3 h-3 mr-2" />
                Reports & Analytics
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">Reports</h1>
            </div>
            {attendance.length > 0 && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl shadow-lg">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Attendance Report</h2>
              <p className="text-sm text-gray-500">Filter and generate attendance reports</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <select
                  value={filters.course_id}
                  onChange={(e) => setFilters({ ...filters, course_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium appearance-none"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>
            </div>
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Results Table */}
        {attendance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Results</h2>
              <p className="text-sm text-gray-600">{attendance.length} records found</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Course
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
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {record.user?.full_name || record.user?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{record.course?.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{record.date}</span>
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
          </div>
        )}

        {attendance.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-100">
            <FileText className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Generated</h3>
            <p className="text-gray-600 text-lg">Use the filters above to generate an attendance report</p>
          </div>
        )}
      </div>
    </div>
  );
};
