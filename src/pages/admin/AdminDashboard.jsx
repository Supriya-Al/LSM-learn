import { useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  Users,
  BookOpen,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  UserCheck,
  FileText,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    totalAttendance: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        coursesRes,
        enrollmentsRes,
        certificatesRes,
        attendanceRes,
      ] = await Promise.all([
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
        api.get('/enrollments').catch(() => ({ data: [] })),
        api.get('/admin/certificates').catch(() => ({ data: [] })),
        api.get('/attendance').catch(() => ({ data: [] })),
      ]);

      const usersData = usersRes.data || [];
      const coursesData = coursesRes.data || [];
      const enrollmentsData = enrollmentsRes.data || [];
      const certificatesData = certificatesRes.data || [];
      const attendanceData = attendanceRes.data || [];

      // Filter only students (non-admin users)
      const studentsData = usersData.filter((u) => u.role !== 'admin');

      setStudents(studentsData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setCertificates(certificatesData);
      setAttendance(attendanceData);

      setStats({
        totalStudents: studentsData.length,
        totalCourses: coursesData.length,
        totalEnrollments: enrollmentsData.length,
        totalCertificates: certificatesData.filter((c) => c.status === 'GENERATED').length,
        totalAttendance: attendanceData.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get student enrollment history
  const getStudentHistory = () => {
    return students.map((student) => {
      const studentEnrollments = enrollments.filter((e) => e.user_id === student.id);
      const studentCertificates = certificates.filter((c) => c.user_id === student.id);
      const studentAttendance = attendance.filter((a) => a.user_id === student.id);

      return {
        ...student,
        enrollments: studentEnrollments.map((enrollment) => {
          const course = courses.find((c) => c.id === enrollment.course_id);
          const certificate = studentCertificates.find(
            (c) => c.course_id === enrollment.course_id
          );
          
          // Get detailed attendance for this course
          const courseAttendance = studentAttendance.filter(
            (a) => a.course_id === enrollment.course_id
          );
          
          const daysPresent = courseAttendance.filter((a) => a.status === 'present').length;
          const daysAbsent = courseAttendance.filter((a) => a.status === 'absent').length;
          const daysLate = courseAttendance.filter((a) => a.status === 'late').length;
          const daysExcused = courseAttendance.filter((a) => a.status === 'excused').length;
          const totalDays = course?.total_days || 0;
          const attendancePercentage = totalDays > 0 
            ? Math.round((daysPresent / totalDays) * 100) 
            : 0;

          // Calculate duration
          const enrollmentDate = enrollment.created_at ? new Date(enrollment.created_at) : null;
          const completionDate = enrollment.completed_at ? new Date(enrollment.completed_at) : null;
          const duration = completionDate && enrollmentDate && !isNaN(completionDate.getTime()) && !isNaN(enrollmentDate.getTime())
            ? Math.ceil((completionDate - enrollmentDate) / (1000 * 60 * 60 * 24))
            : null;

          // Get day of week for enrollment and completion
          const enrollmentDay = enrollmentDate && !isNaN(enrollmentDate.getTime()) 
            ? enrollmentDate.toLocaleDateString('en-US', { weekday: 'long' })
            : null;
          const completionDay = completionDate && !isNaN(completionDate.getTime())
            ? completionDate.toLocaleDateString('en-US', { weekday: 'long' })
            : null;

          // Performance metrics
          const performance = {
            progress: enrollment.progress || 0,
            attendanceRate: attendancePercentage,
            daysPresent,
            daysAbsent,
            daysLate,
            daysExcused,
            totalDays,
            status: enrollment.status,
          };

          return {
            ...enrollment,
            course,
            certificate,
            enrollmentDate: enrollment.created_at,
            enrollmentDay,
            completionDate: enrollment.completed_at,
            completionDay,
            duration,
            attendance: courseAttendance.sort((a, b) => new Date(a.date) - new Date(b.date)),
            performance,
          };
        }),
        totalEnrollments: studentEnrollments.length,
        totalCertificates: studentCertificates.filter((c) => c.status === 'GENERATED').length,
      };
    });
  };

  // Get course enrollment summary
  const getCourseSummary = () => {
    return courses.map((course) => {
      const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
      const courseCertificates = certificates.filter(
        (c) => c.course_id === course.id && c.status === 'GENERATED'
      );
      const courseAttendance = attendance.filter((a) => a.course_id === course.id);

      // Get enrollment details
      const enrollmentDetails = courseEnrollments.map((enrollment) => {
        const student = students.find((s) => s.id === enrollment.user_id);
        const certificate = certificates.find(
          (c) => c.course_id === course.id && c.user_id === enrollment.user_id
        );
        const studentAttendance = courseAttendance.filter(
          (a) => a.user_id === enrollment.user_id
        );
        const daysPresent = studentAttendance.filter((a) => a.status === 'present').length;

        return {
          student: student?.full_name || student?.email || 'Unknown',
          studentEmail: student?.email,
          enrolledDate: enrollment.created_at,
          completionDate: enrollment.completed_at,
          status: enrollment.status,
          progress: enrollment.progress,
          certificateStatus: certificate?.status || 'N/A',
          daysPresent,
          totalDays: course.total_days || 0,
          duration: enrollment.completed_at && enrollment.created_at
            ? Math.ceil(
                (new Date(enrollment.completed_at) - new Date(enrollment.created_at)) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        };
      });

      return {
        ...course,
        totalEnrollments: courseEnrollments.length,
        totalCertificates: courseCertificates.length,
        enrollmentDetails,
      };
    });
  };

  const studentHistory = getStudentHistory();
  const courseSummary = getCourseSummary();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <span className="text-sm font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Student history, course enrollments, and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCourses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Enrollments</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalEnrollments}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Certificates</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCertificates}</p>
              </div>
              <Award className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Attendance Records</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalAttendance}</p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Student History Section */}
        <div className="mb-8">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Courses Enrolled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Certificates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {studentHistory.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {student.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{student.totalEnrollments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{student.totalCertificates}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {student.enrollments.length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-orange-600 hover:text-orange-700">
                                View {student.enrollments.length} course(s)
                              </summary>
                              <div className="mt-2 space-y-4 pl-4 border-l-2 border-slate-200">
                                {student.enrollments.map((enrollment, idx) => (
                                  <div key={idx} className="pt-2 pb-3 border-b border-slate-100 last:border-0">
                                    <div className="font-semibold text-slate-900 text-sm mb-2">
                                      {enrollment.course?.title || 'Unknown Course'}
                                    </div>
                                    
                                    {/* Enrollment & Completion Dates */}
                                    <div className="bg-slate-50 rounded-md p-2 mb-2">
                                      <div className="text-xs space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-3 h-3 text-blue-500" />
                                          <span className="text-slate-600">Enrolled:</span>
                                          <span className="font-medium text-slate-900">
                                            {formatDate(enrollment.enrollmentDate)}
                                          </span>
                                          {enrollment.enrollmentDay && (
                                            <span className="text-slate-400">({enrollment.enrollmentDay})</span>
                                          )}
                                        </div>
                                        {enrollment.completionDate && (
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            <span className="text-slate-600">Completed:</span>
                                            <span className="font-medium text-slate-900">
                                              {formatDate(enrollment.completionDate)}
                                            </span>
                                            {enrollment.completionDay && (
                                              <span className="text-slate-400">({enrollment.completionDay})</span>
                                            )}
                                            {enrollment.duration && (
                                              <span className="text-slate-500 ml-1">
                                                · Duration: {enrollment.duration} days
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <div className="bg-blue-50 rounded-md p-2">
                                        <div className="text-xs text-slate-600">Progress</div>
                                        <div className="text-sm font-bold text-blue-700">
                                          {enrollment.performance.progress}%
                                        </div>
                                      </div>
                                      <div className="bg-green-50 rounded-md p-2">
                                        <div className="text-xs text-slate-600">Attendance Rate</div>
                                        <div className="text-sm font-bold text-green-700">
                                          {enrollment.performance.attendanceRate}%
                                        </div>
                                      </div>
                                    </div>

                                    {/* Attendance Breakdown */}
                                    <div className="mb-2">
                                      <div className="text-xs font-medium text-slate-700 mb-1">Attendance Details:</div>
                                      <div className="text-xs text-slate-600 space-y-0.5">
                                        <div>
                                          Present: <span className="font-medium text-green-600">
                                            {enrollment.performance.daysPresent}
                                          </span>
                                          {' / '}
                                          Absent: <span className="font-medium text-red-600">
                                            {enrollment.performance.daysAbsent}
                                          </span>
                                          {' / '}
                                          Late: <span className="font-medium text-amber-600">
                                            {enrollment.performance.daysLate}
                                          </span>
                                          {' / '}
                                          Excused: <span className="font-medium text-blue-600">
                                            {enrollment.performance.daysExcused}
                                          </span>
                                          {' / '}
                                          Total Days: <span className="font-medium text-slate-900">
                                            {enrollment.performance.totalDays}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Attendance Timeline */}
                                    {enrollment.attendance && enrollment.attendance.length > 0 && (
                                      <details className="mt-2">
                                        <summary className="text-xs text-orange-600 cursor-pointer hover:text-orange-700">
                                          View Attendance Timeline ({enrollment.attendance.length} records)
                                        </summary>
                                        <div className="mt-2 space-y-1 pl-2 border-l-2 border-orange-200">
                                          {enrollment.attendance.map((att, attIdx) => (
                                            <div key={attIdx} className="text-xs text-slate-600 py-1">
                                              <span className="font-medium">
                                                {formatDate(att.date)}
                                              </span>
                                              {' - '}
                                              <span className={`font-medium ${
                                                att.status === 'present' ? 'text-green-600' :
                                                att.status === 'absent' ? 'text-red-600' :
                                                att.status === 'late' ? 'text-amber-600' :
                                                'text-blue-600'
                                              }`}>
                                                {att.status.toUpperCase()}
                                              </span>
                                              {att.session && (
                                                <span className="text-slate-400 ml-1">
                                                  ({att.session})
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}

                                    {/* Certificate Status */}
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                      <div className="text-xs text-slate-600">
                                        Certificate:{' '}
                                        {enrollment.certificate?.status === 'GENERATED' ? (
                                          <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Generated
                                          </span>
                                        ) : enrollment.certificate?.status === 'PENDING_APPROVAL' ? (
                                          <span className="text-amber-600 font-medium">Pending Approval</span>
                                        ) : (
                                          <span className="text-slate-400 font-medium">Not Available</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mt-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        enrollment.status === 'completed' 
                                          ? 'bg-green-100 text-green-700'
                                          : enrollment.status === 'enrolled'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {enrollment.status.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <span className="text-slate-400">No enrollments</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Course Summary Section */}
        <div>
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Course Enrollment Summary
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Certificates Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Enrollment Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {courseSummary.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{course.title}</div>
                        <div className="text-xs text-slate-500">{course.total_days || 0} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{course.totalEnrollments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{course.totalCertificates}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {course.total_days || 'N/A'} days
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {course.enrollmentDetails.length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-orange-600 hover:text-orange-700">
                                View {course.enrollmentDetails.length} enrollment(s)
                              </summary>
                              <div className="mt-2 space-y-3 pl-4 border-l-2 border-slate-200">
                                {course.enrollmentDetails.map((detail, idx) => (
                                  <div key={idx} className="pt-2">
                                    <div className="font-medium text-slate-900">{detail.student}</div>
                                    <div className="text-xs text-slate-500 space-y-1 mt-1">
                                      <div>
                                        Email: <span className="font-medium">{detail.studentEmail}</span>
                                      </div>
                                      <div>
                                        Enrolled: <span className="font-medium">
                                          {formatDateTime(detail.enrolledDate)}
                                        </span>
                                      </div>
                                      <div>
                                        Status: <span className="font-medium">{detail.status}</span>
                                      </div>
                                      <div>
                                        Progress: <span className="font-medium">{detail.progress}%</span>
                                      </div>
                                      <div>
                                        Days Present: <span className="font-medium">
                                          {detail.daysPresent} / {detail.totalDays}
                                        </span>
                                      </div>
                                      <div>
                                        Certificate:{' '}
                                        {detail.certificateStatus === 'GENERATED' ? (
                                          <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Generated
                                          </span>
                                        ) : detail.certificateStatus === 'PENDING_APPROVAL' ? (
                                          <span className="text-amber-600 font-medium">Pending</span>
                                        ) : (
                                          <span className="text-slate-400 font-medium">Not Available</span>
                                        )}
                                      </div>
                                      {detail.completionDate && (
                                        <div>
                                          Completed: <span className="font-medium">
                                            {formatDateTime(detail.completionDate)}
                                          </span>
                                          {detail.duration && (
                                            <span className="text-slate-400 ml-2">
                                              (Duration: {detail.duration} days)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <span className="text-slate-400">No enrollments</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
