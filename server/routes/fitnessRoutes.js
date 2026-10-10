const express = require('express');
const router = express.Router();
const {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/fitnessController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getWorkouts)
  .post(protect, adminOnly, createWorkout);

router.route('/:id')
  .get(getWorkoutById)
  .put(protect, adminOnly, updateWorkout)
  .delete(protect, adminOnly, deleteWorkout);

module.exports = router;
