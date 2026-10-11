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

// ── Cross-origin Google OAuth popup relay (bridges http://localhost:5173 callback to deployed HTTPS frontend) ──
let pendingGoogleOAuthRelay = null;

router.post('/google/relay', (req, res) => {
  const { hash } = req.body || {};
  if (hash) {
    pendingGoogleOAuthRelay = { hash, ts: Date.now() };
  }
  res.json({ ok: true });
});

router.get('/google/relay', (req, res) => {
  if (pendingGoogleOAuthRelay && Date.now() - pendingGoogleOAuthRelay.ts < 60000) {
    const payload = pendingGoogleOAuthRelay;
    pendingGoogleOAuthRelay = null;
    return res.json(payload);
  }
  res.json({ hash: null });
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
