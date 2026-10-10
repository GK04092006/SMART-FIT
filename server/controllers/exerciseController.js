const Exercise = require('../models/Exercise');
const { getDBStatus } = require('../config/db');

const requireDatabase = (res) => {
  if (!getDBStatus()) {
    res.status(503).json({ message: 'MongoDB is not connected. Exercise data was not changed.' });
    return false;
  }
  return true;
};

// @desc Get all exercises
// @route GET /api/exercises
const getExercises = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;

    const { category, difficulty, muscleGroup, search } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (muscleGroup && muscleGroup !== 'All') query.muscleGroup = muscleGroup;
    if (search) query.name = { $regex: search, $options: 'i' };

    const exercises = await Exercise.find(query).sort({ createdAt: -1 });
    return res.json(exercises);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc Get exercise by ID
// @route GET /api/exercises/:id
const getExerciseById = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    return res.json(exercise);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc Create an exercise
// @route POST /api/exercises
const createExercise = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const exercise = await Exercise.create(req.body);
    return res.status(201).json(exercise);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// @desc Update an exercise
// @route PUT /api/exercises/:id
const updateExercise = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;

    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    return res.json(exercise);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// @desc Delete an exercise
// @route DELETE /api/exercises/:id
const deleteExercise = async (req, res) => {
  try {
    if (!requireDatabase(res)) return;

    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    return res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
