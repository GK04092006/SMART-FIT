const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  sendPhoneOtp,
  verifyPhoneOtp,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── Public routes ──────────────────────────────────────────────
router.post('/register',           registerUser);
router.post('/login',              loginUser);
router.post('/google',             googleLogin);
router.post('/phone/send-otp',     sendPhoneOtp);
router.post('/phone/verify-otp',   verifyPhoneOtp);

// ── Protected routes ───────────────────────────────────────────
router.get('/me',     protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
