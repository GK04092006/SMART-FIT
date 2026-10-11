import axios from 'axios';

const FALLBACK_BACKEND_API = 'https://smart-fit-yykj.onrender.com/api';

// By default use relative '/api' so Netlify Functions (/.netlify/functions/api),
// Vercel rewrites, Render same-origin, and Vite dev proxy all work seamlessly.
// If VITE_API_URL is explicitly set, route directly to that backend URL.
const rawBase = import.meta.env.VITE_API_URL || '';
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

// Response interceptor — fallback to Render backend if static-only deployed, and auto-logout on 401
API.interceptors.response.use(
  (response) => {
    // If a static host returned index.html (string) instead of JSON for an /api route, retry on fallback backend
    if (
      typeof response.data === 'string' &&
      response.data.trim().startsWith('<!doctype html') &&
      response.config &&
      !response.config._retriedFallback
    ) {
      response.config._retriedFallback = true;
      response.config.baseURL = FALLBACK_BACKEND_API;
      return API.request(response.config);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    // Automatic fallback if Netlify Function is unreachable (e.g. manual drag-and-drop of dist only)
    if (
      config &&
      !config._retriedFallback &&
      (!error.response || error.response.status === 404 || error.response.status === 502) &&
      typeof error.response?.data === 'string'
    ) {
      config._retriedFallback = true;
      config.baseURL = FALLBACK_BACKEND_API;
      return API.request(config);
    }

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
