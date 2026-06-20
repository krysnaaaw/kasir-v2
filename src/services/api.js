import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-kasirv2-59u6j3fn9-krysnaaaws-projects.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
