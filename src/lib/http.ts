import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import { logClientError } from '@/lib/logger';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add Supabase auth token
http.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Response interceptor for error logging
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const method = (error?.config?.method || '').toUpperCase();
    const url = error?.config?.url;
    const statusText = error?.response?.statusText;
    
    logClientError(
      'error',
      `HTTP ${status || ''} ${method} ${url || ''}`,
      'axios',
      { statusText }
    );
    
    return Promise.reject(error);
  }
);