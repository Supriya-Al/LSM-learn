import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Try to get token from localStorage first
  let token = localStorage.getItem('supabase.auth.token');
  
  // If not in localStorage, get from current session
  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
        // Store it for next time
        localStorage.setItem('supabase.auth.token', token);
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API request with token:', config.url);
  } else {
    console.warn('No token found for API request:', config.url);
    console.warn('User may need to log in again');
  }
  return config;
});

// Log API errors and handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // If 401, try to refresh token
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token);
          // Retry the request with new token
          error.config.headers.Authorization = `Bearer ${session.access_token}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login if token refresh fails
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('supabase.auth.token');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

