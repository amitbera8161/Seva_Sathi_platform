const express = require('express');
const bloodRequestController = require('../controllers/bloodrequest.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — anyone can see open blood requests (transparency + urgency),
// same pattern as EmergencyRequest's public list/detail.
router.get('/', optionalAuth, bloodRequestController.list);
router.get('/:id', optionalAuth, bloodRequestController.getById);

router.use(requireAuth);

router.post('/', bloodRequestController.create);

router.get('/me/requests', bloodRequestController.listMine);
router.get('/me/donor-matches', bloodRequestController.listMyDonorMatches);

router.post('/:id/donor-response', bloodRequestController.donorRespond);
router.post('/:id/rematch', bloodRequestController.rematch);
router.post('/:id/confirm', bloodRequestController.confirm);
router.patch('/:id/cancel', bloodRequestController.cancel);

module.exports = router;
