import axios from 'axios';

// In production on Vercel/Netlify, VITE_API_URL points to the live Render backend server
// If omitted in production, it defaults to https://smart-fit-yykj.onrender.com/api
const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://smart-fit-yykj.onrender.com' : '');
const baseURL = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`)
  : '/api';

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-logout on 401 (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/login')
        || error.config?.url?.includes('/auth/register')
        || error.config?.url?.includes('/auth/google')
        || error.config?.url?.includes('/auth/phone');

      if (!isAuthRoute) {
        // Token expired or invalid — clear session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
