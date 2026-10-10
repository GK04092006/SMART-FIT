const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  submitAssessment,
  getMyAssessment,
  getAllAssessments,
  addWorkoutLog,
  updateFitnessAssessment,
  // calculateReadiness removed — canonical version lives in readinessController
} = require('../controllers/assessmentController');

router.post('/',            protect, submitAssessment);
router.get('/my',           protect, getMyAssessment);
router.patch('/my',         protect, updateFitnessAssessment);
router.get('/all',          protect, adminOnly, getAllAssessments); // admin only
router.post('/workout-log', protect, addWorkoutLog);

// Legacy readiness route — redirect callers to the canonical /api/readiness/:adventureId
// which includes stamina/flexibility checks, writes fitnessScore back, and returns training tips.
router.get('/readiness/:adventureId', protect, (req, res) => {
  res.redirect(308, `/api/readiness/${req.params.adventureId}`);
});

module.exports = router;
