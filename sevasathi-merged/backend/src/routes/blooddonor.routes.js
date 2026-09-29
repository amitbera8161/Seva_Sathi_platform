const express = require('express');
const bloodDonorController = require('../controllers/blooddonor.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — anyone can search for emergency donors, even logged out
router.get('/search', optionalAuth, bloodDonorController.findEmergencyDonors);

router.use(requireAuth); // everything below requires login

router.post('/', bloodDonorController.register);
router.get('/me', bloodDonorController.getMyProfile);
router.patch('/me', bloodDonorController.updateProfile);
router.post('/me/donations', bloodDonorController.recordDonation);

// ---- Admin-only ----
router.get('/admin/pending', requireRole('admin'), bloodDonorController.listPendingVerification);
router.post('/admin/:id/verify', requireRole('admin'), bloodDonorController.verifyDonor);

module.exports = router;