const express = require('express');
const emergencyRequestController = require('../controllers/emergencyrequest.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — anyone can see what's needed, even logged out
router.get('/', optionalAuth, emergencyRequestController.list);
router.get('/:id', optionalAuth, emergencyRequestController.getById);

router.use(requireAuth); // everything below requires login

router.post('/', emergencyRequestController.create);
router.post('/:id/help', emergencyRequestController.offerHelp);
router.delete('/:id/help', emergencyRequestController.withdrawHelp);
router.patch('/:id/resolve', emergencyRequestController.resolve);
router.delete('/:id', emergencyRequestController.remove);

module.exports = router;
