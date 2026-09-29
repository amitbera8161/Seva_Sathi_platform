const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — impact numbers are meant to be shown off, even logged out
router.get('/dashboard', optionalAuth, analyticsController.getDashboard);

module.exports = router;
