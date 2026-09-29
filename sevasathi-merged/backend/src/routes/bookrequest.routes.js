const express = require('express');
const bookRequestController = require('../controllers/bookrequest.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth); // every book-request action requires login

// Volunteer/NGO/Admin platform-wide oversight view for coordination.
router.get('/', requireRole('volunteer', 'ngo', 'admin'), bookRequestController.listAll);

router.get('/me/requests', bookRequestController.myRequests); // Beneficiary: requests I made
router.get('/me/donor-requests', bookRequestController.incomingRequests); // Donor: requests on my books

router.patch('/:id/approve', bookRequestController.approve);
router.patch('/:id/reject', bookRequestController.reject);
router.patch('/:id/collect', bookRequestController.collect);
router.patch('/:id/complete', bookRequestController.complete);
router.patch('/:id/cancel', bookRequestController.cancel);

module.exports = router;
