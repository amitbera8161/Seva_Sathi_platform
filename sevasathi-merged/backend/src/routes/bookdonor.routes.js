const express = require('express');
const bookDonorController = require('../controllers/bookdonor.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Book donor preferences profile (contact method, delivery radius,
// default location). Actual book listings/search/requests live under
// /books and /book-requests — see book.routes.js and bookrequest.routes.js.
router.use(requireAuth);

router.post('/', bookDonorController.register);
router.get('/me', bookDonorController.getMyProfile);
router.patch('/me', bookDonorController.updateProfile);

module.exports = router;
