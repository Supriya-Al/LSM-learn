import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, ClipboardCheck, BarChart3, 
  GraduationCap, LogOut, User, Bell
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
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/courses', label: 'Courses', icon: BookOpen },
        { path: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
        { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
        { path: '/dashboard', label: 'User Portal', icon: GraduationCap },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/courses', label: 'Courses', icon: BookOpen },
        { path: '/enrollments', label: 'Your Enrollments', icon: GraduationCap },
        { path: '/attendance', label: 'Your Progress', icon: ClipboardCheck },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30">
      <nav className="bg-white/80 backdrop-blur-md shadow-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-2 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                {/* Logo text in soft orange for a subtle brand accent */}
                <h1 className="text-2xl font-extrabold text-orange-500">
                  LMS Platform
                </h1>
              </Link>
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'text-orange-600'
                          : 'text-gray-600 hover:text-orange-700'
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
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                profile?.role === 'admin' 
                  ? 'bg-slate-900 text-white'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {profile?.role?.toUpperCase()}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

