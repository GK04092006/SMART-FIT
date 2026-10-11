import axios from 'axios';

const LOCAL_BACKEND_API = 'http://localhost:5000/api';
const FALLBACK_BACKEND_API = 'https://smart-fit-yykj.onrender.com/api';

// If VITE_API_URL is set, use it; otherwise use relative '/api'
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

// Probe if local backend (connected to mongodb://localhost:27017/) is running on this machine
// If running, route deployed Netlify/Vercel frontend directly to http://localhost:5000/api so data saves in local MongoDB Compass!
if (
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  !import.meta.env.VITE_API_URL
) {
  fetch(`${LOCAL_BACKEND_API}/health`, { method: 'GET', mode: 'cors' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && data.status === 'OK') {
        API.defaults.baseURL = LOCAL_BACKEND_API;
        console.info('[SmartFit API] Connected to local backend (mongodb://localhost:27017/)');
      }
    })
    .catch(() => {
      // Local backend not running on this device — keep using Netlify Function (/api)
    });
}

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
