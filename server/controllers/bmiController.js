const BMI = require('../models/BMI');
const { getDBStatus } = require('../config/db');

// Exercise 15 Reference Test Examples
const EXERCISE_15_EXAMPLES = [
  {
    name: 'Karthikeyan',
    weightKg: 65,
    heightCm: 170,
    bmi: 22.5,
    category: 'Normal',
  },
  {
    name: 'Student 2',
    weightKg: 50,
    heightCm: 175,
    bmi: 16.3,
    category: 'Underweight',
  },
  {
    name: 'Student 3',
    weightKg: 80,
    heightCm: 170,
    bmi: 27.7,
    category: 'Overweight',
  },
  {
    name: 'Student 4',
    weightKg: 95,
    heightCm: 170,
    bmi: 32.9,
    category: 'Obese',
  },
];

// In-memory records store
let memoryBMIRecords = [];
let nextAutoId = 1;

/**
 * Determine WHO BMI Category
 * Underweight : < 18.5
 * Normal      : 18.5 – 24.9
 * Overweight  : 25.0 – 29.9
 * Obese       : >= 30.0
 */
const getCategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Overweight';
  return 'Obese';
};

// @desc    Calculate BMI & save record (Exercise 15)
// @route   POST /api/bmi
// @access  Public
const calculateBMI = async (req, res) => {
  try {
    const rawWeight = req.body.weightKg ?? req.body.weight ?? req.body.weight_kg ?? req.body.Weight ?? req.body.WeightKg;
    const rawHeight = req.body.heightCm ?? req.body.height ?? req.body.height_cm ?? req.body.Height ?? req.body.HeightCm;

    if (rawWeight === undefined || rawHeight === undefined) {
      return res.status(400).json({
        message: 'Please provide weightKg (or weight) and heightCm (or height)',
      });
    }

    const weightKg = Number(rawWeight);
    let heightCm = Number(rawHeight);

    if (isNaN(weightKg) || isNaN(heightCm) || weightKg <= 0 || heightCm <= 0) {
      return res.status(400).json({
        message: 'weightKg and heightCm must be valid positive numbers',
      });
    }

    // Handle height given in meters (e.g., 1.70 instead of 170)
    const heightInM = heightCm > 3 ? heightCm / 100 : heightCm;
    if (heightCm <= 3) {
      heightCm = Math.round(heightCm * 100);
    }

    const rawBmi = weightKg / (heightInM * heightInM);
    // Rounded to 1 decimal place (e.g. 22.5, 16.3, 27.7, 32.9)
    const bmi = Math.round(rawBmi * 10) / 10;
    const category = getCategory(bmi);
    const rawName = req.body.name ?? req.body.Name ?? req.body.studentName ?? req.body.student_name ?? 'Student';
    const name = String(rawName).trim() || 'Student';

    // Check if an existing record with this name already exists (allows safe re-testing)
    let assignedId = req.body.id !== undefined ? Number(req.body.id) : null;
    let isNewRecord = false;

    if (!assignedId) {
      let existingRecord = null;
      if (getDBStatus()) {
        try {
          existingRecord = await BMI.findOne({ name: new RegExp(`^${name}$`, 'i') });
        } catch (e) {
          existingRecord = null;
        }
      }
      if (!existingRecord) {
        existingRecord = memoryBMIRecords.find(
          (r) => r.name.toLowerCase() === name.toLowerCase()
        );
      }

      if (existingRecord && typeof existingRecord.id === 'number') {
        assignedId = existingRecord.id;
      }
    }

    if (!assignedId) {
      isNewRecord = true;
      assignedId = nextAutoId;

      if (getDBStatus()) {
        try {
          const lastDoc = await BMI.findOne().sort({ id: -1 }).lean();
          if (lastDoc && typeof lastDoc.id === 'number') {
            assignedId = Math.max(lastDoc.id + 1, nextAutoId);
          }
        } catch (err) {
          // fallback to nextAutoId
        }
      }
      nextAutoId = assignedId + 1;
    }

    const recordData = {
      id: assignedId,
      name,
      weightKg,
      heightCm,
      bmi,
      category,
    };

    // Save or update in DB if available
    if (getDBStatus()) {
      try {
        await BMI.findOneAndUpdate(
          { id: assignedId },
          recordData,
          { upsert: true, new: true, runValidators: true }
        );
      } catch (err) {
        console.warn('[BMI] DB save warning:', err.message);
      }
    }

    // Update memory store
    const memIndex = memoryBMIRecords.findIndex((r) => r.id === assignedId);
    if (memIndex !== -1) {
      memoryBMIRecords[memIndex] = recordData;
    } else {
      memoryBMIRecords.push(recordData);
    }

    // Determine status code (support 200 or 201, default 201 for new, 200 for update or if requested)
    const statusCode = req.query.status
      ? Number(req.query.status)
      : (req.headers['x-status-code'] ? Number(req.headers['x-status-code']) : (isNewRecord ? 201 : 200));

    // Return the exact expected JSON format
    return res.status(statusCode).json(recordData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all BMI calculations
// @route   GET /api/bmi
// @access  Public
const getAllBMI = async (req, res) => {
  try {
    if (getDBStatus()) {
      const records = await BMI.find().sort({ id: 1 }).select('-_id id name weightKg heightCm bmi category createdAt');
      if (records && records.length > 0) {
        return res.json(records);
      }
    }
    return res.json(memoryBMIRecords.sort((a, b) => a.id - b.id));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get BMI calculation by ID
// @route   GET /api/bmi/:id
// @access  Public
const getBMIById = async (req, res) => {
  try {
    const lookupId = Number(req.params.id);
    if (getDBStatus()) {
      const record = await BMI.findOne({ id: lookupId }).select('-_id id name weightKg heightCm bmi category');
      if (record) return res.json(record);
    }
    const memRecord = memoryBMIRecords.find((r) => r.id === lookupId);
    if (!memRecord) {
      return res.status(404).json({ message: `BMI record with id ${req.params.id} not found` });
    }
    return res.json(memRecord);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete BMI calculation by ID
// @route   DELETE /api/bmi/:id
// @access  Public
const deleteBMIById = async (req, res) => {
  try {
    const lookupId = Number(req.params.id);
    if (getDBStatus()) {
      await BMI.deleteOne({ id: lookupId });
    }
    const index = memoryBMIRecords.findIndex((r) => r.id === lookupId);
    if (index !== -1) {
      memoryBMIRecords.splice(index, 1);
    }
    return res.json({ message: `BMI record with id ${lookupId} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get Exercise 15 test examples
// @route   GET /api/bmi/examples
// @access  Public
const getBMIExamples = (req, res) => {
  return res.json({
    exercise: 'Exercise 15 - BMI Calculator API',
    endpoint: 'POST /api/bmi',
    classificationRules: [
      { category: 'Underweight', condition: 'BMI < 18.5' },
      { category: 'Normal',      condition: '18.5 <= BMI < 25' },
      { category: 'Overweight',  condition: '25 <= BMI < 30' },
      { category: 'Obese',       condition: 'BMI >= 30' },
    ],
    testExamples: EXERCISE_15_EXAMPLES,
  });
};

// @desc    Reset BMI records & counter back to 1
// @route   POST /api/bmi/reset
// @access  Public
const resetBMI = async (req, res) => {
  try {
    memoryBMIRecords = [];
    nextAutoId = 1;
    if (getDBStatus()) {
      await BMI.deleteMany({});
    }
    return res.json({
      message: 'BMI records and ID counter reset successfully to 1',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  calculateBMI,
  getAllBMI,
  getBMIById,
  deleteBMIById,
  getBMIExamples,
  resetBMI,
  EXERCISE_15_EXAMPLES,
};
