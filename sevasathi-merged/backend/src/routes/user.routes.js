const express = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth); // every route below requires a logged-in user

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.post('/me/roles', userController.addRole);
router.delete('/me/roles/:role', userController.removeRole);
router.post('/me/deactivate', userController.deactivateAccount);

module.exports = router;