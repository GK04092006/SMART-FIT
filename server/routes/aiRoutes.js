const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/aiController');

router.get('/recommendations', getRecommendations);

module.exports = router;
