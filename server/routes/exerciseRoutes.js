const express = require('express');
const router = express.Router();
const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../controllers/exerciseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getExercises)
  .post(protect, adminOnly, createExercise);

router.route('/:id')
  .get(getExerciseById)
  .put(protect, adminOnly, updateExercise)
  .delete(protect, adminOnly, deleteExercise);

module.exports = router;
