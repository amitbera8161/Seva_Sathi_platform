const express = require('express');
const ngoController = require('../controllers/ngo.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — browse/view verified NGOs
router.get('/', optionalAuth, ngoController.listNGOs);
router.get('/:id', optionalAuth, ngoController.getNGOById);

router.use(requireAuth); // everything below requires login

router.post('/', ngoController.register);
router.get('/me/profile', ngoController.getMyNGO);
router.patch('/me/profile', ngoController.updateNGO);
router.post('/me/documents', ngoController.uploadVerificationDocument);

// ---- Admin-only ----
router.get('/admin/pending', requireRole('admin'), ngoController.listPendingNGOs);
router.post('/admin/:id/verify', requireRole('admin'), ngoController.verifyNGO);
router.post('/admin/:id/reject', requireRole('admin'), ngoController.rejectNGO);

module.exports = router;