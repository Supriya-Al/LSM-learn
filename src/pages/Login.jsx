import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, GraduationCap, Shield, UserPlus, User } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect after successful login based on user role
  useEffect(() => {
    if (user && profile) {
      console.log('🔄 User and profile loaded, redirecting...', { 
        userId: user.id, 
        role: profile.role,
        isAdminMode 
      });
      
      if (profile.role === 'admin') {
        console.log('🔄 Redirecting to admin portal...');
        navigate('/admin', { replace: true });
      } else if (user && !loading) {
        // Only redirect to dashboard if we're not in admin mode
        // and we're not already on a protected route
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/') {
          console.log('🔄 Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, profile, navigate, loading, isAdminMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        console.log('📝 Attempting to sign up:', email);
        await signUp(email, password, fullName, 'user');
        setError('');
        alert('Account created successfully! Please check your email to verify your account, then sign in.');
        setIsSignUp(false);
        setFullName('');
        setLoading(false);
      } else {
        // Sign in existing user
        console.log('🔐 Attempting to sign in:', email);
        
        // Add timeout to prevent infinite loading
        const signInWithTimeout = Promise.race([
          signIn(email, password),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sign in request timed out. Please check your connection and try again.')), 8000)
          )
        ]);
        
        await signInWithTimeout;
        console.log('✅ Sign in successful');
        
        // Reset loading after a short delay to allow redirect
        // If redirect doesn't happen, user can try again
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Sign in/up error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        error: err.error,
        fullError: err
      });
      
      // Provide more specific error messages
      let errorMessage = err.message || (isSignUp ? 'Failed to sign up' : 'Failed to sign in');
      
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch') || err.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('supabase') || err.message?.includes('URL') || err.message?.includes('Configuration')) {
        errorMessage = 'Configuration error. Please check Supabase settings.';
      } else if (err.message?.includes('timeout') || err.message?.includes('timed out')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    // If already logged in as admin, navigate to admin portal
    if (user && profile && profile.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    
    // Otherwise, activate admin mode
    setIsAdminMode(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8 border border-white/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-4 rounded-2xl shadow-xl animate-pulse-glow relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  <GraduationCap className="w-12 h-12 text-white relative z-10" />
                </div>
              </div>
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
              {isAdminMode 
                ? 'Admin Portal Access' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isAdminMode 
                ? 'Sign in with your admin credentials' 
                : isSignUp
                  ? 'Sign up to start your learning journey'
                  : 'Sign in to your LMS account'}
            </p>
            {isAdminMode && (
              <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                <p className="text-xs text-orange-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin mode active - You'll be redirected to Admin Portal after login
                </p>
              </div>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg flex items-center gap-2 animate-shake">
                <span className="text-red-500">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required={isSignUp}
                      className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 bg-white/50 backdrop-blur-sm"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 bg-white/50 backdrop-blur-sm"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {isSignUp && (
                  <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:via-amber-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 shadow-xl font-bold text-lg relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="relative z-10">{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Sign Up</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Sign In</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFullName('');
              }}
              className="text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-semibold">Sign In</span></>
              ) : (
                <>Don't have an account? <span className="font-semibold">Sign Up</span></>
              )}
            </button>
          </div>

          {!isSignUp && (
            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 border border-slate-800 shadow-lg">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Admin Access
            </p>
            <button
              type="button"
              onClick={handleAdminLogin}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-slate-700 rounded-xl text-white bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700/60 transform hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 shadow-xl font-bold text-lg relative overflow-hidden group"
            >
              <Shield className="w-5 h-5" />
              <span>{isAdminMode ? 'Admin Mode Active' : 'Sign In as Admin'}</span>
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Use your admin account credentials to access the Admin Portal
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

