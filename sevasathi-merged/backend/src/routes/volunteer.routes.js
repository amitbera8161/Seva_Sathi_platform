const express = require('express');
const volunteerController = require('../controllers/volunteer.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — NGOs/anyone can browse volunteers by cause/skill/location
router.get('/search', optionalAuth, volunteerController.findVolunteers);

router.use(requireAuth); // everything below requires login

router.post('/', volunteerController.register);
router.get('/me', volunteerController.getMyProfile);
router.patch('/me', volunteerController.updateProfile);
router.post('/me/events/:eventId/apply', volunteerController.applyToEvent);
router.post('/me/events/:eventId/attended', volunteerController.markEventAttended);

module.exports = router;