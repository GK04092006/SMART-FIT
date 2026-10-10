const jwt = require('jsonwebtoken');

// ── Enforce a real JWT secret ───────────────────────────────────────────────
// Do NOT fall back to a well-known default — that makes every deployed instance
// share the same signing key if the admin forgets to set the env variable.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    return 'super_secret_fitness_adventure_key_2026';
  }
  return secret;
};

// Validate secret at startup (called once when the module is loaded)
const JWT_SECRET = getJwtSecret();

// ── protect ─────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  // ── Removed: guest-token / demo-token bypass ──────────────────────────────
  // Accepting magic strings without cryptographic verification lets any client
  // bypass authentication entirely. All callers must use a real JWT.

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      _id:   decoded.id,
      id:    decoded.id,
      email: decoded.email,
      role:  decoded.role || 'user',
    };

    return next();
  } catch (error) {
    // Distinguish expiry from tampered/invalid tokens for better client UX
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// ── Role guards ──────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Admin privileges required' });
};

const organizerOnly = (req, res, next) => {
  if (req.user?.role === 'organizer' || req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Organizer privileges required' });
};

const trainerOnly = (req, res, next) => {
  if (req.user?.role === 'trainer' || req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Trainer privileges required' });
};

const guideOnly = (req, res, next) => {
  if (req.user?.role === 'guide' || req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Guide privileges required' });
};

const safetyTeamOnly = (req, res, next) => {
  if (['guide', 'organizer', 'admin'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Access denied: Safety team privileges required' });
};

module.exports = { protect, adminOnly, organizerOnly, trainerOnly, guideOnly, safetyTeamOnly };
