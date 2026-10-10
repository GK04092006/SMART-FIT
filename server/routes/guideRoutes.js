const express = require('express');
const router = express.Router();
const { protect, guideOnly, safetyTeamOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Booking = require('../models/Booking');
const SosIncident = require('../models/SosIncident');
const notificationService = require('../services/notificationService');

// @desc  Get all live/upcoming adventure events being guided (guide/admin only)
// @route GET /api/guide/live-events
router.get('/live-events', protect, guideOnly, async (req, res) => {
  try {
    // Return confirmed adventure bookings as "live events"
    const liveEvents = await Booking.find({
      itemType: 'Adventure',
      status: { $in: ['Confirmed', 'Pending'] },
    })
      .populate('user', 'name email phone fitnessLevel avatar emergencyContact')
      .sort({ bookingDate: 1 })
      .limit(20);

    res.json(liveEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get participants for a specific event (guide/admin only)
// @route GET /api/guide/participants/:bookingId
router.get('/participants/:bookingId', protect, guideOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('user', 'name email phone fitnessLevel fitnessAssessment emergencyContact avatar');
    if (!booking) return res.status(404).json({ message: 'Event not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get all active participants (users with confirmed bookings) (guide/admin only)
// @route GET /api/guide/active-participants
router.get('/active-participants', protect, guideOnly, async (req, res) => {
  try {
    const confirmedBookings = await Booking.find({ status: 'Confirmed' })
      .populate('user', 'name email fitnessLevel fitnessAssessment emergencyContact avatar phone');

    // Deduplicate by user
    const seen = new Set();
    const participants = [];
    for (const b of confirmedBookings) {
      if (b.user && !seen.has(String(b.user._id))) {
        seen.add(String(b.user._id));
        participants.push(b.user);
      }
    }

    res.json(participants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Update booking status (guide can mark as in-progress/completed)
// @route PUT /api/guide/events/:bookingId/status
router.put('/events/:bookingId/status', protect, guideOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Confirmed', 'Pending', 'Cancelled', 'Completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status },
      { new: true }
    ).populate('user').populate('itemRef');

    if (!booking) return res.status(404).json({ message: 'Event not found' });

    // Event J: Adventure Completion Notification
    if (status === 'Completed' && booking.user) {
      notificationService.sendAdventureCompletionNotification({
        user: booking.user,
        booking,
        adventure: booking.itemRef,
        duration: booking.itemRef?.durationDays ? `${booking.itemRef.durationDays} Days` : '1 Day',
        checkpointsCompleted: booking.itemRef?.checkpoints?.length || 5,
        xpEarned: 250,
        badge: 'Trail Conqueror',
      }).catch(err => console.error('[Completion Notif Error]', err.message));
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── Smart SOS Endpoints ──────────────────────────────────────────────────────

// @desc  Trigger a Smart SOS — creates incident record in DB (any authenticated user)
// @route POST /api/guide/sos/trigger
router.post('/sos/trigger', protect, async (req, res) => {
  try {
    const {
      lat, lng, accuracy, address,
      nearestGuide, nearestEmergencyPoint,
      triggeredByName, adventureTitle, incidentType, message,
    } = req.body;

    const incident = await SosIncident.create({
      triggeredBy: req.user._id,
      triggeredByName: triggeredByName || req.user.name || req.user.email || 'Unknown',
      location: { lat, lng, accuracy, address },
      nearestGuide,
      nearestEmergencyPoint,
      organizerNotified: true,
      organizerName: 'Event Organizer',
      status: 'Active',
    });

    // Event I: High Priority SOS Notification dispatch to guide, organizer, admin, emergency contact
    const triggeringUser = await User.findById(req.user._id);
    const locationCoords = (lat && lng) ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : (address || 'GPS Coordinates reported');

    const notificationResults = await notificationService.sendSosEmergencyNotification({
      incident,
      triggeredByUser: triggeringUser,
      adventureTitle: adventureTitle || 'Active Expedition Route',
      incidentType: incidentType || 'SOS Distress Alert',
      locationCoordinates: locationCoords,
      sosMessage: message || 'Participant activated emergency SOS button. Immediate field response initiated.',
    });

    res.status(201).json({
      ...incident.toObject(),
      notificationsSent: notificationResults.filter((result) => result.inApp?.success).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  List recent SOS incidents (guide/organizer/admin only)
// @route GET /api/guide/sos/incidents
router.get('/sos/incidents', protect, safetyTeamOnly, async (req, res) => {
  try {
    const incidents = await SosIncident.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Resolve an SOS incident (guide/organizer/admin only)
// @route PUT /api/guide/sos/incidents/:id/resolve
router.put('/sos/incidents/:id/resolve', protect, safetyTeamOnly, async (req, res) => {
  try {
    const incident = await SosIncident.findOneAndUpdate(
      { incidentId: req.params.id },
      { status: 'Resolved', resolvedAt: new Date(), notes: req.body.notes || '' },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
