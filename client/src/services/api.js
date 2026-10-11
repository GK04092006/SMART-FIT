import axios from 'axios';

const LOCAL_BACKEND_API = 'http://localhost:5000/api';
const FALLBACK_BACKEND_API = 'https://smart-fit-yykj.onrender.com/api';

const rawBase = import.meta.env.VITE_API_URL || '';
const initialBaseURL = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`)
  : '/api';

const API = axios.create({
  baseURL: initialBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let backendResolvePromise = null;
let resolvedBaseURL = null;

const ensureBackendResolved = async () => {
  if (resolvedBaseURL) return resolvedBaseURL;
  if (typeof window === 'undefined') return initialBaseURL;

  // When running directly on localhost:5000, '/api' already hits the local MongoDB backend
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    resolvedBaseURL = initialBaseURL;
    return resolvedBaseURL;
  }

  if (!backendResolvePromise) {
    backendResolvePromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${LOCAL_BACKEND_API}/health`, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'OK') {
            resolvedBaseURL = LOCAL_BACKEND_API;
            API.defaults.baseURL = LOCAL_BACKEND_API;
            return resolvedBaseURL;
          }
        }
      } catch {
        // Local MongoDB server not reachable on this device — use cloud backend (/api)
      }
      resolvedBaseURL = initialBaseURL;
      return resolvedBaseURL;
    })();
  }

  return backendResolvePromise;
};

// Trigger initial resolution immediately
ensureBackendResolved();

// Request interceptor — ensure backend URL is resolved and attach JWT token
API.interceptors.request.use(
  async (config) => {
    if (!config._retriedFallback) {
      const targetBase = await ensureBackendResolved();
      config.baseURL = targetBase;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — fallback to cloud backend if needed, and auto-logout on 401
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
      (!error.response || error.response.status === 404 || error.response.status === 502)
    ) {
      config._retriedFallback = true;
      config.baseURL = FALLBACK_BACKEND_API;
      return API.request(config);
    }

    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/google') ||
        error.config?.url?.includes('/auth/phone');

      if (!isAuthRoute) {
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
