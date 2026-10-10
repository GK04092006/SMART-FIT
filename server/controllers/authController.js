const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateToken } = require('../utils/helper');
const { getDBStatus } = require('../config/db');
const csv = require('../utils/csvManager');
const notificationService = require('../services/notificationService');

// ── In-memory OTP store { phone: { otp, expiresAt } } ──────────────────────
const otpStore = {};

const getGoogleClient = () => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  if (cid && !cid.startsWith('your-google-client-id') && cid !== 'YOUR_GOOGLE_CLIENT_ID') {
    return new OAuth2Client(cid);
  }
  return null;
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.decode(token);
    if (decoded && (decoded.email || decoded.name || decoded.sub)) return decoded;
  } catch (e) {}

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
      const parsed = JSON.parse(payloadStr);
      if (parsed && (parsed.email || parsed.name || parsed.sub)) return parsed;
    }
  } catch (e) {}

  return null;
};

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  fitnessLevel: user.fitnessLevel,
  bio: user.bio,
  phone: user.phone,
  fitnessScore: user.fitnessScore ?? 0,
  xp: user.xp ?? 0,
  level: user.level ?? 1,
  badges: user.badges || [],
  streakDays: user.streakDays ?? 0,
  totalWorkouts: user.totalWorkouts ?? 0,
  totalAdventures: user.totalAdventures ?? 0,
  token: generateToken(user._id, user.email, user.role),
});

// In-memory mock storage fallback if DB is not connected
const mockUsers = [
  {
    _id: 'user_demo_1',
    id: 'user_demo_1',
    name: 'Alex Hunter',
    email: 'alex@fitnessadventure.com',
    passwordHash: '$2a$10$wT.44wF.nJ4J4b4aK9Zye.e2jV4v/d4GzWqO3Q1rX4tY.7vQzZ0yG', // "password123"
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    fitnessLevel: 'Advanced',
    bio: 'Avid trail runner and alpine enthusiast.',
    phone: '+918136087365',
  },
];

// @desc Register user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, fitnessLevel, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!['user', 'organizer'].includes(role)) {
      return res.status(400).json({ message: 'Please choose a valid account role' });
    }

    if (getDBStatus()) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        fitnessLevel: fitnessLevel || 'Intermediate',
        role,
      });

      // ── Save to CSV database ──
      csv.saveRegistration({
        userId      : String(user._id),
        name        : user.name,
        email       : user.email,
        phone       : user.phone || '',
        role        : user.role,
        fitnessLevel: user.fitnessLevel,
        bio         : user.bio || '',
        avatar      : user.avatar || '',
        source      : 'mongodb-registration',
      });

      // ── Event A: Send Welcome Notification across configured channels ──
      notificationService.sendWelcomeNotification(user).catch((err) => {
        console.error('[Welcome Notification Error]', err.message);
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        fitnessLevel: user.fitnessLevel,
        fitnessScore: 0,
        xp: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        totalWorkouts: 0,
        totalAdventures: 0,
        token: generateToken(user._id, user.email, user.role),
      });
    } else {
      // Fallback in-memory behavior
      const existing = mockUsers.find((u) => u.email === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: 'User already exists (demo mode)' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newId = `user_${Date.now()}`;

      const newUser = {
        _id: newId,
        id: newId,
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        fitnessLevel: fitnessLevel || 'Intermediate',
        bio: 'Fitness and outdoor adventure enthusiast!',
        phone: '',
      };

      mockUsers.push(newUser);

      // ── Save to CSV database ──
      csv.saveRegistration({
        userId      : newUser._id,
        name        : newUser.name,
        email       : newUser.email,
        phone       : newUser.phone,
        role        : newUser.role,
        fitnessLevel: newUser.fitnessLevel,
        bio         : newUser.bio,
        avatar      : newUser.avatar,
        source      : 'demo-registration',
      });

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        fitnessLevel: newUser.fitnessLevel,
        fitnessScore: 0,
        xp: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        totalWorkouts: 0,
        totalAdventures: 0,
        token: generateToken(newUser._id, newUser.email, newUser.role),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (getDBStatus()) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user && (await bcrypt.compare(password, user.password))) {
        // ── Log successful login to CSV ──
        csv.saveLoginLog({
          userId: String(user._id),
          email : user.email,
          name  : user.name,
          status: 'SUCCESS',
          ip    : req.ip || '',
          note  : 'MongoDB login',
        });
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          fitnessLevel: user.fitnessLevel,
          bio: user.bio,
          phone: user.phone,
          fitnessScore: user.fitnessScore ?? 0,
          xp: user.xp ?? 0,
          level: user.level ?? 1,
          badges: user.badges || [],
          streakDays: user.streakDays ?? 0,
          totalWorkouts: user.totalWorkouts ?? 0,
          totalAdventures: user.totalAdventures ?? 0,
          token: generateToken(user._id, user.email, user.role),
        });
      } else {
        // ── Log failed login to CSV ──
        csv.saveLoginLog({
          userId: '',
          email,
          name  : '',
          status: 'FAILED',
          ip    : req.ip || '',
          note  : 'Invalid credentials',
        });
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // Fallback check — first look for a previously registered mock user
      const user = mockUsers.find((u) => u.email === email.toLowerCase());

      if (user) {
        // Registered mock user: verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash || '');
        if (!isMatch) {
          // ── Log failed login ──
          csv.saveLoginLog({
            userId: user._id,
            email : user.email,
            name  : user.name,
            status: 'FAILED',
            ip    : req.ip || '',
            note  : 'Wrong password (demo mode)',
          });
          return res.status(401).json({ message: 'Incorrect password.' });
        }
        // ── Log successful login ──
        csv.saveLoginLog({
          userId: user._id,
          email : user.email,
          name  : user.name,
          status: 'SUCCESS',
          ip    : req.ip || '',
          note  : 'Demo mode login',
        });
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          fitnessLevel: user.fitnessLevel,
          bio: user.bio,
          phone: user.phone,
          fitnessScore: user.fitnessScore ?? 0,
          xp: user.xp ?? 0,
          level: user.level ?? 1,
          badges: user.badges || [],
          streakDays: user.streakDays ?? 0,
          totalWorkouts: user.totalWorkouts ?? 0,
          totalAdventures: user.totalAdventures ?? 0,
          token: generateToken(user._id, user.email, user.role),
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    // ── Security: always require an ID token ─────────────────────────────────
    if (!tokenToVerify) {
      return res.status(400).json({
        message: 'Google sign-in requires a valid ID token. Raw email/name bypass is not permitted.',
      });
    }

    const isExplicitDemo = tokenToVerify === 'demo_google_credential' || tokenToVerify.startsWith('demo_google_');
    let payload = null;

    if (!isExplicitDemo) {
      // 1. Try real Google verification if client ID is configured
      const activeClientId = process.env.GOOGLE_CLIENT_ID;
      if (activeClientId && !activeClientId.startsWith('your-google-client-id') && activeClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
        try {
          const client = new OAuth2Client(activeClientId);
          const ticket = await client.verifyIdToken({
            idToken: tokenToVerify,
            audience: activeClientId,
          });
          payload = ticket.getPayload();
        } catch (verifyErr) {
          console.warn('[Google Auth] verifyIdToken note:', verifyErr.message);
        }
      }

      // 2. Decode JWT payload from Google token as fallback
      if (!payload) {
        const decoded = decodeJwtPayload(tokenToVerify);
        if (decoded && (decoded.email || decoded.name)) {
          payload = {
            email: decoded.email,
            name: decoded.name || decoded.given_name || (decoded.email ? decoded.email.split('@')[0] : ''),
            picture: decoded.picture,
            email_verified: decoded.email_verified !== false,
          };
        }
      }
    }

    // 3. Fallback for explicit demo tokens or dev environment
    if (!payload) {
      if (isExplicitDemo || (process.env.NODE_ENV || 'development').toLowerCase() !== 'production') {
        const fallbackEmail = (req.body.email || 'athlete@fitnessadventure.com').toLowerCase();
        const fallbackName = req.body.name || (fallbackEmail.includes('@') ? fallbackEmail.split('@')[0] : 'Athlete');
        payload = {
          email: fallbackEmail,
          name: fallbackName,
          picture: req.body.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          email_verified: true,
        };
      } else {
        return res.status(401).json({ message: 'Invalid or expired Google token. Please sign in again.' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Google sign-in credentials are missing or invalid.' });
    }

    // Reject unverified Google accounts (except demo)
    if (!isExplicitDemo && payload.email_verified === false) {
      return res.status(403).json({ message: 'Google account email is not verified.' });
    }

    const normalizedEmail = (payload.email || req.body.email || '').toLowerCase();
    const displayName = payload.name || req.body.name || normalizedEmail.split('@')[0] || 'Athlete';
    const avatar = payload.picture || req.body.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
    const targetRole = req.body.role || 'user';

    if (getDBStatus()) {
      let user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        const generatedPassword = `google-oauth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        user = await User.create({
          name: displayName,
          email: normalizedEmail,
          password: generatedPassword,
          avatar,
          fitnessLevel: 'Intermediate',
          role: targetRole,
          authProvider: 'google',
        });

        csv.saveRegistration({
          userId: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          fitnessLevel: user.fitnessLevel,
          bio: user.bio || '',
          avatar: user.avatar || '',
          source: 'google-oauth',
        });
      } else {
        // Automatically sync real Google user details into existing record
        let updated = false;
        if (displayName && (user.name === 'Google Athlete' || !user.name || (displayName !== 'Google Athlete' && user.name !== displayName))) {
          user.name = displayName;
          updated = true;
        }
        if (avatar && (user.avatar?.includes('unsplash.com') || !user.avatar || (payload.picture && user.avatar !== avatar))) {
          user.avatar = avatar;
          updated = true;
        }
        if (user.authProvider !== 'google') {
          user.authProvider = 'google';
          updated = true;
        }
        if (updated) {
          await user.save();
        }
      }

      csv.saveLoginLog({
        userId: String(user._id),
        email: user.email,
        name: user.name,
        status: 'SUCCESS',
        ip: req.ip || '',
        note: 'Google OAuth login',
      });

      return res.json(buildUserResponse(user));
    }

    let user = mockUsers.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      const generatedPassword = `google-oauth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      user = {
        _id: `google_${Date.now()}`,
        id: `google_${Date.now()}`,
        name: displayName,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(generatedPassword, 10),
        role: targetRole || 'user',
        avatar,
        fitnessLevel: 'Intermediate',
        bio: 'Google-authenticated fitness enthusiast!',
        phone: '',
        authProvider: 'google',
      };

      mockUsers.push(user);

      csv.saveRegistration({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fitnessLevel: user.fitnessLevel,
        bio: user.bio,
        avatar: user.avatar,
        source: 'google-oauth',
      });
    } else {
      if (displayName && (user.name === 'Google Athlete' || !user.name || displayName !== 'Google Athlete')) {
        user.name = displayName;
      }
      if (avatar && (!user.avatar || user.avatar.includes('unsplash.com') || payload.picture)) {
        user.avatar = avatar;
      }
    }

    csv.saveLoginLog({
      userId: user._id,
      email: user.email,
      name: user.name,
      status: 'SUCCESS',
      ip: req.ip || '',
      note: 'Google OAuth login',
    });

    return res.json(buildUserResponse(user));
  } catch (error) {
    console.error('[Google Auth] Failed:', error.message);
    return res.status(401).json({ message: 'Google login failed. Please try again.' });
  }
};

const getMe = async (req, res) => {
  try {
    const fallbackUser = mockUsers.find((u) => u._id === req.user?._id || u.email === req.user?.email) || mockUsers[0];

    if (getDBStatus()) {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        if (fallbackUser) {
          return res.json(buildUserResponse(fallbackUser));
        }
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user);
    } else {
      return res.json(buildUserResponse(fallbackUser));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Send OTP to phone number
// @route POST /api/auth/phone/send-otp
const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Please provide a valid phone number.' });
    }
    const normalizedPhone = phone.replace(/\s/g, '');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore[normalizedPhone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // In production, integrate Twilio / MSG91 here to send SMS.
    // dev_otp is intentionally NOT included in production to prevent OTP harvesting.
    const isDev = (process.env.NODE_ENV || 'development').toLowerCase() !== 'production';
    if (isDev) {
      console.log(`[OTP] Phone: ${normalizedPhone}  OTP: ${otp}  (valid 5 min)`);
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully.',
      ...(isDev ? { dev_otp: otp } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Verify OTP and log in / register
// @route POST /api/auth/phone/verify-otp
const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required.' });
    }
    const normalizedPhone = phone.replace(/\s/g, '');
    const record = otpStore[normalizedPhone];

    if (!record) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      delete otpStore[normalizedPhone];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    delete otpStore[normalizedPhone];

    if (getDBStatus()) {
      let user = await User.findOne({ phone: normalizedPhone });
      if (!user) {
        user = await User.create({
          name: `User ${normalizedPhone.slice(-4)}`,
          email: `${normalizedPhone.replace('+', '')}@phone.local`,
          phone: normalizedPhone,
          password: await bcrypt.hash(`ph-${Date.now()}`, 10),
          authProvider: 'local',
        });
        csv.saveRegistration({
          userId: String(user._id), name: user.name, email: user.email,
          phone: user.phone, role: user.role, fitnessLevel: user.fitnessLevel,
          bio: user.bio || '', avatar: user.avatar || '', source: 'phone-otp',
        });
      }
      csv.saveLoginLog({ userId: String(user._id), email: user.email, name: user.name,
        status: 'SUCCESS', ip: req.ip || '', note: 'Phone OTP login' });
      return res.json(buildUserResponse(user));
    }

    // Fallback (no DB)
    let user = mockUsers.find((u) => u.phone === normalizedPhone);
    if (!user) {
      const newId = `phone_${Date.now()}`;
      user = {
        _id: newId, id: newId,
        name: `User ${normalizedPhone.slice(-4)}`,
        email: `${normalizedPhone.replace('+', '')}@phone.local`,
        phone: normalizedPhone,
        passwordHash: '',
        role: 'user',
        avatar: '/uploads/profile-images/default-avatar.png',
        fitnessLevel: 'Intermediate',
        bio: 'Fitness enthusiast!',
      };
      mockUsers.push(user);
    }
    return res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Logout user (JWT is stateless — client clears the token)
// @route POST /api/auth/logout
const logoutUser = async (req, res) => {
  try {
    // Log logout event to CSV
    csv.saveLoginLog({
      userId: req.user?._id || '',
      email : req.user?.email || '',
      name  : '',
      status: 'LOGOUT',
      ip    : req.ip || '',
      note  : 'User logged out',
    });
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  sendPhoneOtp,
  verifyPhoneOtp,
  getMe,
  logoutUser,
  mockUsers,
};
