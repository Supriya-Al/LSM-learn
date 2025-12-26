import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a safe Supabase client - use dummy values if not configured to prevent errors
let supabase;
try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
  );
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase not fully configured - using placeholder client');
  } else {
    console.log('✅ Supabase client initialized:', {
      url: supabaseUrl.substring(0, 30) + '...',
      hasKey: !!supabaseAnonKey
    });
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  // Create a minimal mock client to prevent app crash
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null })
    }
  };
}

export { supabase };

