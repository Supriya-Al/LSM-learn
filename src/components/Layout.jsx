import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, ClipboardCheck, 
  GraduationCap, LogOut, User, Bell, Award
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'User Management', icon: Users },
        { path: '/admin/courses', label: 'Course Management', icon: BookOpen },
        { path: '/admin/attendance', label: 'Attendance Management', icon: ClipboardCheck },
        { path: '/admin/certificates', label: 'Certificate Management', icon: Award },
        { path: '/dashboard', label: 'Student Portal', icon: GraduationCap },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/courses', label: 'Courses', icon: BookOpen },
        { path: '/enrollments', label: 'Your Enrollments', icon: GraduationCap },
        { path: '/attendance', label: 'Your Progress', icon: ClipboardCheck },
      ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/about" className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-2 rounded-lg shadow-sm">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  LMS Platform
                </h1>
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">{profile?.email}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                profile?.role === 'admin' 
                  ? 'bg-slate-900 text-white'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {profile?.role?.toUpperCase()}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="bg-white">
        {children}
      </main>
    </div>
  );
};

