/**
 * authService.js
 * Centralised authentication API calls.
 * All methods return the raw axios response .data.
 */
import API from './api';

const authService = {
  /** Register a new user */
  register: (payload) => API.post('/auth/register', payload).then((r) => r.data),

  /** Email + password login */
  login: (email, password) =>
    API.post('/auth/login', { email, password }).then((r) => r.data),

  /** Google OAuth login (credential = id_token JWT from Google) */
  googleLogin: (credential) =>
    API.post('/auth/google', { credential }).then((r) => r.data),

  /** Send OTP to phone */
  sendOtp: (phone) =>
    API.post('/auth/phone/send-otp', { phone }).then((r) => r.data),

  /** Verify OTP and get session */
  verifyOtp: (phone, otp) =>
    API.post('/auth/phone/verify-otp', { phone, otp }).then((r) => r.data),

  /** Fetch the current authenticated user */
  getMe: () => API.get('/auth/me').then((r) => r.data),

  /** Fetch full profile (used for avatar/bio refresh) */
  getProfile: () => API.get('/profile/me').then((r) => r.data),
};

export default authService;
