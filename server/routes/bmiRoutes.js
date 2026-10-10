const express = require('express');
const router = express.Router();
const {
  calculateBMI,
  getAllBMI,
  getBMIById,
  deleteBMIById,
  getBMIExamples,
  resetBMI,
} = require('../controllers/bmiController');

// POST   /api/bmi (Exercise 15 test endpoint)
// GET    /api/bmi (List all calculated records)
// DELETE /api/bmi (Clear all records & reset counter)
router.route('/')
  .post(calculateBMI)
  .get(getAllBMI)
  .delete(resetBMI);

// GET /api/bmi/examples (Returns pre-configured Exercise 15 test examples)
router.get('/examples', getBMIExamples);

// POST /api/bmi/reset (Resets counter & records back to 1)
router.post('/reset', resetBMI);

// GET    /api/bmi/:id (Get single record by id)
// DELETE /api/bmi/:id (Delete single record by id)
router.route('/:id')
  .get(getBMIById)
  .delete(deleteBMIById);

module.exports = router;
