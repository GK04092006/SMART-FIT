const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');

const {
  getProfile,
  updateProfile,
  uploadAvatar,
  recordRecentlyAccessed,
  getSettings,
  updateSettings,
  testCommunication,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { FILES }   = require('../utils/csvManager');

// ── Storage configuration for profile image uploads ──────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/profile-images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// ── Profile CRUD ─────────────────────────────────────────────
router.route('/me')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.route('/')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/recently-accessed', protect, recordRecentlyAccessed);

// ── Settings & Communication ──────────────────────────────────
router.route('/settings')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.post('/communication/test', protect, testCommunication);

// ── CSV Download Endpoints (no auth guard — add protect if desired) ──
// GET /api/profile/csv/registrations  → download users_registrations.csv
router.get('/csv/registrations', (req, res) => {
  const filePath = FILES.registrations;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'No registrations data yet.' });
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="users_registrations.csv"');
  fs.createReadStream(filePath).pipe(res);
});

// GET /api/profile/csv/logins  → download users_login_log.csv
router.get('/csv/logins', (req, res) => {
  const filePath = FILES.loginLog;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'No login log data yet.' });
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="users_login_log.csv"');
  fs.createReadStream(filePath).pipe(res);
});

// GET /api/profile/csv/profile-updates  → download users_profile_updates.csv
router.get('/csv/profile-updates', (req, res) => {
  const filePath = FILES.profileUpdates;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'No profile update data yet.' });
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="users_profile_updates.csv"');
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
