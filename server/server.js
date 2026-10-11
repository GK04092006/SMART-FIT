const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables (supports running from root or server/ directory)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const { connectDB, getDBInfo } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { initCSVStore } = require('./utils/csvManager');

const authRoutes       = require('./routes/authRoutes');
const fitnessRoutes    = require('./routes/fitnessRoutes');
const exerciseRoutes   = require('./routes/exerciseRoutes');
const adventureRoutes  = require('./routes/adventureRoutes');
const bookingRoutes    = require('./routes/bookingRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const aiRoutes         = require('./routes/aiRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const trainerRoutes    = require('./routes/trainerRoutes');
const guideRoutes      = require('./routes/guideRoutes');
const readinessRoutes  = require('./routes/readinessRoutes');
const bmiRoutes        = require('./routes/bmiRoutes');
const emailRoutes      = require('./routes/emailRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const communicationRoutes = require('./routes/communicationRoutes');

// Connect to MongoDB
connectDB();

// Initialise CSV flat-file store (server/database/*.csv)
initCSVStore();

const app = express();

// Middleware — allow Netlify/Vercel HTTPS sites to connect to local backend (mongodb://localhost:27017/)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Normalize Netlify Function paths (/.netlify/functions/api/* -> /api/*) and ensure DB is connected
app.use(async (req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api') || '/api';
  } else if (
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/uploads') &&
    (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || req.headers['x-nf-request-id'])
  ) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  if (req.url.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      console.warn('[DB Middleware] connectDB warning:', err.message);
    }
  }
  next();
});

// Ensure upload directory exists (serverless-safe)
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL
);
const uploadBaseDir = isServerless
  ? path.join(os.tmpdir(), 'fitness-uploads')
  : path.join(__dirname, 'uploads');
const uploadDir = path.join(uploadBaseDir, 'profile-images');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Uploads] Could not create upload directory:', err.message);
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadBaseDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  const dbInfo = getDBInfo();
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
  res.json({
    status: 'OK',
    message: 'Fitness & Adventure API is running smoothly',
    platform: process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME ? 'netlify-functions' : 'node-server',
    database: dbInfo,
    oauth: {
      googleConfigured: Boolean(googleClientId && !googleClientId.startsWith('your-google-client-id')),
      provider: 'Google OAuth 2.0 + MongoDB User Store',
    },
    timestamp: new Date(),
  });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/fitness',    fitnessRoutes);
app.use('/api/exercises',  exerciseRoutes);
app.use('/api/bmi',        bmiRoutes);      // Exercise 15 BMI API
app.use('/api/adventure',  adventureRoutes);
app.use('/api/booking',    bookingRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/readiness',  readinessRoutes);
app.use('/api/ai',         aiRoutes);
app.use('/api/email',      emailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communication', communicationRoutes);

// ── Role-specific API Routes ─────────────────────────────────
app.use('/api/admin',   adminRoutes);    // admin only
app.use('/api/trainer', trainerRoutes);  // trainer + admin
app.use('/api/guide',   guideRoutes);    // guide + admin

// ── Serve Frontend Static Build (if built & not running as serverless function) ──
const clientDistPath = path.join(__dirname, '../client/dist');
const clientIndexHtml = path.join(clientDistPath, 'index.html');

if (!isServerless && fs.existsSync(clientIndexHtml)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(clientIndexHtml);
  });
} else {
  // Root route fallback when running API-only
  app.get('/', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Fitness & Adventure API is running smoothly',
      database: getDBInfo(),
      timestamp: new Date(),
      endpoints: '/api/health, /api/auth, /api/fitness, /api/bmi, /api/adventure, /api/booking, /api/profile, /api/assessment, /api/ai, /api/admin, /api/trainer, /api/guide',
    });
  });
}

// Global Process Error Handlers to prevent abrupt crashes
process.on('uncaughtException', (err) => {
  console.error('[Server UncaughtException]:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server UnhandledRejection]:', reason?.message || reason);
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fitness & Adventure Server] Running on http://localhost:${PORT}`);
    console.log(`[Roles] admin → /api/admin | trainer → /api/trainer | guide → /api/guide`);
  });

  // Dedicated Google OAuth 2.0 Callback Relay (receives Google's redirect_uri=http://localhost:5173,
  // forwards the OAuth token to http://localhost:5000/api/auth/google/relay, and immediately closes the popup)
  if (Number(PORT) !== 5173) {
    const oauthCallbackRelay = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Completing Google Sign-In…</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;">
  <p>Completing Google Sign-In…</p>
  <script>
    (function () {
      var hash = window.location.hash || '';
      var targetOrigin = 'http://localhost:${PORT}';
      var targetPath = '/login';
      try {
        var params = new URLSearchParams(hash.replace(/^#/, ''));
        var stateStr = params.get('state');
        if (stateStr) {
          var st = JSON.parse(atob(stateStr));
          if (st && st.origin) targetOrigin = st.origin;
          if (st && st.returnPath) targetPath = st.returnPath;
        }
      } catch (e) {}

      if (hash) {
        fetch('http://localhost:${PORT}/api/auth/google/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash: hash }),
          keepalive: true
        }).finally(function () {
          try { window.close(); } catch (e) {}
          setTimeout(function () {
            window.location.replace(targetOrigin + targetPath + hash);
          }, 250);
        });
      } else {
        window.location.replace(targetOrigin);
      }
    })();
  </script>
</body>
</html>`);
    });

    oauthCallbackRelay.on('error', () => {});
    oauthCallbackRelay.listen(5173, '0.0.0.0');
  }

  const gracefulShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

module.exports = app;
