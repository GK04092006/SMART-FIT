const express = require('express');
const router = express.Router();
const { protect, organizerOnly } = require('../middleware/authMiddleware');
const {
  getAdventureReadiness,
  recordAssessment,
  recordWorkout,
  getMyReadinessOverview,
  getAdventureParticipantsReadiness,
} = require('../controllers/readinessController');

// All readiness operations require authenticated user (JWT)
router.get('/my', protect, getMyReadinessOverview);
router.post('/assessment', protect, recordAssessment);
router.post('/workout', protect, recordWorkout);
router.get('/:adventureId', protect, getAdventureReadiness);

// Organizer / Guide / Admin view of all registered participants' readiness for an adventure
router.get('/adventure/:adventureId/participants', protect, organizerOnly, getAdventureParticipantsReadiness);

module.exports = router;
