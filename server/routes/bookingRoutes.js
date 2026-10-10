const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  checkInParticipant,
  getAdventureBookings,
  assignTeam,
} = require('../controllers/bookingController');
const { protect, adminOnly, organizerOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createBooking)
  .get(protect, organizerOnly, getAllBookings);

const staffOnly = (req, res, next) => {
  if (['admin', 'organizer', 'guide'].includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Access denied: Staff privileges required' });
};

router.get('/my', protect, getMyBookings);
router.post('/checkin', protect, staffOnly, checkInParticipant);
router.get('/adventure/:adventureId', protect, staffOnly, getAdventureBookings);
router.put('/:id/team', protect, organizerOnly, assignTeam);

module.exports = router;
