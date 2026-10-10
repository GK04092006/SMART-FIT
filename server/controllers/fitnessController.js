const Fitness = require('../models/Fitness');
const { getDBStatus } = require('../config/db');
const { initialWorkouts } = require('../utils/helper');

let memoryWorkouts = [...initialWorkouts];

// @desc Get all workout sessions
// @route GET /api/fitness
const getWorkouts = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;

    if (getDBStatus()) {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (difficulty && difficulty !== 'All') {
        query.difficulty = difficulty;
      }
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const workouts = await Fitness.find(query);
      return res.json(workouts);
    } else {
      let filtered = [...memoryWorkouts];
      if (category && category !== 'All') {
        filtered = filtered.filter((w) => w.category.toLowerCase() === category.toLowerCase());
      }
      if (difficulty && difficulty !== 'All') {
        filtered = filtered.filter((w) => w.difficulty.toLowerCase() === difficulty.toLowerCase());
      }
      if (search) {
        filtered = filtered.filter((w) => w.title.toLowerCase().includes(search.toLowerCase()));
      }
      return res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get workout by ID
// @route GET /api/fitness/:id
const getWorkoutById = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const workout = await Fitness.findById(id);
      if (!workout) return res.status(404).json({ message: 'Workout not found' });
      return res.json(workout);
    } else {
      const workout = memoryWorkouts.find((w) => w._id === id || w.id === id);
      if (!workout) return res.status(404).json({ message: 'Workout not found' });
      return res.json(workout);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new workout
// @route POST /api/fitness
const createWorkout = async (req, res) => {
  try {
    const workoutData = req.body;
    if (getDBStatus()) {
      const workout = await Fitness.create(workoutData);
      return res.status(201).json(workout);
    } else {
      const newId = `w_${Date.now()}`;
      const newWorkout = {
        _id: newId,
        id: newId,
        rating: 5.0,
        reviewCount: 1,
        ...workoutData,
      };
      memoryWorkouts.push(newWorkout);
      return res.status(201).json(newWorkout);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update workout
// @route PUT /api/fitness/:id
const updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const workout = await Fitness.findByIdAndUpdate(id, req.body, { new: true });
      if (!workout) return res.status(404).json({ message: 'Workout not found' });
      return res.json(workout);
    } else {
      const index = memoryWorkouts.findIndex((w) => w._id === id || w.id === id);
      if (index === -1) return res.status(404).json({ message: 'Workout not found' });
      memoryWorkouts[index] = { ...memoryWorkouts[index], ...req.body };
      return res.json(memoryWorkouts[index]);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete workout
// @route DELETE /api/fitness/:id
const deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const workout = await Fitness.findByIdAndDelete(id);
      if (!workout) return res.status(404).json({ message: 'Workout not found' });
      return res.json({ message: 'Workout deleted successfully' });
    } else {
      const index = memoryWorkouts.findIndex((w) => w._id === id || w.id === id);
      if (index === -1) return res.status(404).json({ message: 'Workout not found' });
      memoryWorkouts.splice(index, 1);
      return res.json({ message: 'Workout deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};
