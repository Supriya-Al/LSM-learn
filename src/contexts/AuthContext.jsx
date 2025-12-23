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
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      console.log('📋 Fetching profile for user:', userId);
      const { data } = await api.get('/profile');
      console.log('✅ Profile fetched:', data);
      setProfile(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // If it's a 401, the token might be invalid
      if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized - token may be invalid');
        // Clear user session on auth error
        setUser(null);
        setProfile(null);
        localStorage.removeItem('supabase.auth.token');
        setLoading(false);
        return null;
      }
      
      // Get current user info from Supabase session for default profile
      let currentUser = user;
      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user;
      }
      
      // If it's a network error, backend might not be running
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.error('❌ Backend server not reachable. Make sure it\'s running on port 3001');
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabase.auth.token', session.access_token);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    console.log('🔐 AuthContext: Starting sign in...');
    
    // Check if Supabase is configured
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      throw new Error('Authentication service not configured. Please check your environment variables.');
    }
    
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
      
      // Fetch profile after sign in
      if (data.user.id) {
        console.log('📋 Fetching profile for user:', data.user.id);
        await fetchProfile(data.user.id);
      }
    }
    
    return data;
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

