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
const User = require('../models/User');
const { getDBStatus } = require('../config/db');

// ── Return available Google accounts from external MongoDB Atlas store ──
router.get('/google/accounts', async (req, res) => {
  try {
    if (getDBStatus()) {
      const users = await User.find({})
        .select('name email avatar role authProvider')
        .sort({ updatedAt: -1 })
        .limit(15);
      const accounts = users
        .filter((u) => u?.email && !u.email.endsWith('@fitnessadventure.com') && !u.email.endsWith('@phone.local'))
        .map((u) => ({
          email: u.email,
          name: u.name || u.email.split('@')[0],
          picture: u.avatar || '',
        }));
      return res.json({ accounts });
    }
    res.json({ accounts: [] });
  } catch {
    res.json({ accounts: [] });
  }
});

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
