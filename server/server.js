const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route and health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Fitness & Adventure API is running smoothly',
    timestamp: new Date(),
    endpoints: '/api/health, /api/auth, /api/fitness, /api/bmi, /api/adventure, /api/booking, /api/profile, /api/assessment, /api/ai, /api/admin, /api/trainer, /api/guide',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Fitness & Adventure API is running smoothly',
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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Fitness & Adventure Server] Running on http://localhost:${PORT}`);
  console.log(`[Roles] admin → /api/admin | trainer → /api/trainer | guide → /api/guide`);
});

const gracefulShutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
