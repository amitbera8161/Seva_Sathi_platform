const express = require('express');
const resourceController = require('../controllers/resource.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — anyone can browse what's on offer, even logged out
router.get('/', optionalAuth, resourceController.list);
router.get('/:id', optionalAuth, resourceController.getById);

router.use(requireAuth); // everything below requires login

router.post('/', resourceController.create);
router.post('/:id/request', resourceController.request);
router.patch('/:id/requests/respond', resourceController.respondToRequest);
router.patch('/:id/availability', resourceController.updateAvailability);
router.delete('/:id', resourceController.remove);

module.exports = router;
