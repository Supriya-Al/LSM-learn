import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false to show login immediately

  const fetchProfile = async (userId) => {
    try {
      console.log('📋 Fetching profile for user:', userId);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const profilePromise = api.get('/profile');
      const { data } = await Promise.race([profilePromise, timeoutPromise]);
      
      console.log('✅ Profile fetched:', data);
      setProfile(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      // Get current user info from Supabase session for default profile
      let currentUser = user;
      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user;
      }
      
      // If it's a 401, the token might be invalid - clear session
      if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized - token may be invalid');
        setUser(null);
        setProfile(null);
        localStorage.removeItem('supabase.auth.token');
        setLoading(false);
        return null;
      }
      
      // If it's a network error or timeout, backend might not be running
      if (
        error.code === 'ECONNREFUSED' || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Request timeout')
      ) {
        console.error('❌ Backend server not reachable or request timed out. Using default profile.');
        // Create a default profile to prevent infinite loading
        const defaultProfile = {
          id: userId,
          email: currentUser?.email || '',
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
          role: currentUser?.user_metadata?.role || 'user'
        };
        setProfile(defaultProfile);
        setLoading(false);
        return defaultProfile;
      }
      
      // For other errors, set a default profile to prevent infinite loading
      const defaultProfile = {
        id: userId,
        email: currentUser?.email || '',
        full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
        role: currentUser?.user_metadata?.role || 'user'
      };
      setProfile(defaultProfile);
      setLoading(false);
      return defaultProfile;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session - run asynchronously without blocking UI
    const initAuth = async () => {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.warn('⚠️ Supabase not configured - skipping session check');
        return;
      }

      try {
        // Don't set loading to true - let the login page show immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          setLoading(false);
          return;
        }
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setUser(session.user);
          localStorage.setItem('supabase.auth.token', session.access_token);
          setLoading(true); // Show loading while fetching profile for existing session
          await fetchProfile(session.user.id);
        } else {
          setLoading(false); // No session = show login page
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };
    
    // Run async without blocking
    initAuth();

    // Listen for auth changes (only if Supabase is configured)
    let subscription;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const result = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            if (session) {
              setUser(session.user);
              localStorage.setItem('supabase.auth.token', session.access_token);
              await fetchProfile(session.user.id);
            } else {
              setUser(null);
              setProfile(null);
              localStorage.removeItem('supabase.auth.token');
              setLoading(false);
            }
          }
        );
        subscription = result?.data?.subscription;
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    console.log('🔐 AuthContext: Starting sign in...');
    
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || !supabase) {
      console.error('❌ Supabase client not initialized');
      throw new Error('Authentication service not configured. Please check your environment variables.');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
      
      console.log('✅ Sign in successful, user:', data.user?.id);
      
      // Set user immediately
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('supabase.auth.token', data.session?.access_token || '');
        
        // Fetch profile after sign in (with timeout)
        if (data.user.id) {
          console.log('📋 Fetching profile for user:', data.user.id);
          try {
            await fetchProfile(data.user.id);
          } catch (profileError) {
            console.error('Profile fetch error (non-fatal):', profileError);
            // Don't throw - user is still signed in, profile will be fetched later
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email, password, fullName, role = 'user') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('supabase.auth.token');
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

