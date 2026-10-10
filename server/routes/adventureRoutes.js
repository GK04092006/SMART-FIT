const express = require('express');
const router = express.Router();
const {
  getAdventures,
  getAdventureById,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  togglePublishAdventure,
} = require('../controllers/adventureController');
const { protect, adminOnly, organizerOnly } = require('../middleware/authMiddleware');

// GET is public; POST requires organizer or admin
router.route('/')
  .get(getAdventures)
  .post(protect, organizerOnly, createAdventure);

router.put('/:id/publish', protect, organizerOnly, togglePublishAdventure);

// GET by id is public; PUT/DELETE requires organizer or admin
router.route('/:id')
  .get(getAdventureById)
  .put(protect, organizerOnly, updateAdventure)
  .delete(protect, adminOnly, deleteAdventure);  // delete is admin-only

module.exports = router;
