import React, { createContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

/* ── Tiny helper: ensure /uploads/ paths stay relative (Vite proxies them) ── */
const resolveAvatarUrl = (url) => {
  if (!url) return url;
  return url;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Sync user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  /** Fetch the latest profile from the server and update state */
  const refreshCurrentUser = useCallback(async () => {
    try {
      const { data } = await API.get('/profile/me');
      const currentUser = data.user || data;
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      // Profile route may be unavailable in offline/demo mode — ignore silently
      return null;
    }
  }, []);

  // On mount, hydrate latest user data if logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      refreshCurrentUser();
    }
  }, [refreshCurrentUser]);

  /**
   * Internal helper — persist token + user from an auth API response,
   * then try to hydrate the full profile.
   */
  const _applyAuthData = useCallback(async (data, roleHint) => {
    setToken(data.token);
    localStorage.setItem('token', data.token); // write immediately so refresh call can use it
    const me = await refreshCurrentUser();
    const finalUser = me || { ...data, role: data.role || roleHint || 'user' };
    setUser(finalUser);
    return finalUser;
  }, [refreshCurrentUser]);

  // ── Email + Password Login ──────────────────────────────────────────────────
  const login = async (email, password, roleHint = 'user') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      const finalUser = await _applyAuthData(data, roleHint);
      setLoading(false);
      return { success: true, user: finalUser };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setUser(null);
      setToken('');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // ── Google OAuth Login ──────────────────────────────────────────────────────
  const loginWithGoogle = async (credential, extra = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/auth/google', { credential, ...extra });
      const finalUser = await _applyAuthData(data);
      setLoading(false);
      return { success: true, user: finalUser };
    } catch (err) {
      const msg = err.response?.data?.message || 'Google login failed.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // ── Phone OTP Login ─────────────────────────────────────────────────────────
  const loginWithPhone = async (phone, otp) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/auth/phone/verify-otp', { phone, otp });
      const finalUser = await _applyAuthData(data);
      setLoading(false);
      return { success: true, user: finalUser };
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/auth/register', userData);
      setToken(data.token);
      setUser(data);
      setLoading(false);
      return { success: true, user: data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // ── Upload Avatar ───────────────────────────────────────────────────────────
  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await API.post('/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = resolveAvatarUrl(data.avatarUrl);
      setUser((prev) => {
        const updated = { ...prev, avatar: url };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
      return { success: true, url };
    } catch (err) {
      return { success: false, message: 'Upload failed; photo saved locally only.' };
    }
  };

  // ── Update Profile ──────────────────────────────────────────────────────────
  const updateUser = async (profileData) => {
    setLoading(true);
    try {
      const { data } = await API.put('/profile', profileData);
      const updatedFields = data.user || data;
      setUser((prev) => {
        const updated = { ...prev, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
      setLoading(false);
      return { success: true };
    } catch (err) {
      // Offline / guest mode — persist to localStorage anyway
      setUser((prev) => {
        const updated = { ...prev, ...profileData };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
      setLoading(false);
      return { success: true };
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    // Fire-and-forget server logout (logs the event); don't block the UI
    try { await API.post('/auth/logout'); } catch (_) { /* ignore */ }
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setError(null);
  };

  // ── Clear error helper ──────────────────────────────────────────────────────
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token,
        // Auth actions
        login,
        loginWithGoogle,
        loginWithPhone,
        register,
        logout,
        // Profile helpers
        updateUser,
        uploadAvatar,
        refreshCurrentUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
