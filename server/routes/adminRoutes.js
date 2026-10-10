const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Adventure = require('../models/Adventure');
const FitnessAssessment = require('../models/FitnessAssessment');
const WorkoutLog = require('../models/WorkoutLog');

// @desc  Get full analytics snapshot (admin only)
// @route GET /api/admin/analytics
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeThisMonth,        // users who logged a workout this month
      totalBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      totalAdventures,
      totalAssessments,
      avgFitnessAgg,
      bookingsByCategory,
      adventureList,
      recentBookings,
      usersByRole,
      workoutsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      WorkoutLog.distinct('user', { completedAt: { $gte: startOfMonth } }).then(ids => ids.length),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Adventure.countDocuments(),
      FitnessAssessment.countDocuments(),
      User.aggregate([
        { $match: { fitnessScore: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$fitnessScore' } } },
      ]),
      Booking.aggregate([
        { $match: { itemType: 'Adventure' } },
        { $group: { _id: '$itemDetails.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Adventure.find({}, 'title rating reviewCount category difficulty status').sort({ reviewCount: -1 }).limit(10),
      Booking.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(20),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      WorkoutLog.countDocuments({ completedAt: { $gte: startOfMonth } }),
    ]);

    // Monthly workout volume for last 6 months
    const monthlyWorkouts = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return WorkoutLog.countDocuments({ completedAt: { $gte: d, $lte: end } }).then(count => ({
          month: d.toLocaleString('default', { month: 'short' }),
          workouts: count,
        }));
      })
    );

    // Revenue from confirmed bookings this month
    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'Confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const revenueThisMonthAgg = await Booking.aggregate([
      { $match: { status: 'Confirmed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const pctChange = (curr, prev) => {
      if (!prev) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisMonth,
        avgFitnessScore: avgFitnessAgg[0]?.avg ? Math.round(avgFitnessAgg[0].avg * 10) / 10 : 0,
        byRole: usersByRole,
        trendPct: pctChange(newUsersThisMonth, newUsersLastMonth),
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        trendPct: pctChange(bookingsThisMonth, bookingsLastMonth),
        byCategory: bookingsByCategory,
        recent: recentBookings,
      },
      adventures: {
        total: totalAdventures,
        topRated: adventureList,
      },
      fitness: {
        assessmentsTotal: totalAssessments,
        workoutsThisMonth,
        monthlyVolume: monthlyWorkouts,
      },
      revenue: {
        total: revenueAgg[0]?.total || 0,
        thisMonth: revenueThisMonthAgg[0]?.total || 0,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    console.error('[Analytics Error]', err);
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get platform stats (admin only)  — kept for backward-compat
// @route GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalBookings, usersByRole] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ totalUsers, totalBookings, usersByRole, serverTime: new Date() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get all users (admin only)
// @route GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Update user role (admin only)
// @route PUT /api/admin/users/:id/role
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['user', 'admin', 'organizer', 'guide', 'trainer'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Delete user (admin only)
// @route DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get all bookings (admin only)
// @route GET /api/admin/bookings
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email role').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
