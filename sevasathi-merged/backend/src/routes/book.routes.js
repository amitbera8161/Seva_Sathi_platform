const express = require('express');
const bookController = require('../controllers/book.controller');
const bookRequestController = require('../controllers/bookrequest.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — anyone can search/browse available books, even logged out
// (same pattern as /resources and /blood-requests).
router.get('/search', optionalAuth, bookController.search);
router.get('/:id', optionalAuth, bookController.getById);

router.use(requireAuth); // everything below requires login

router.post('/', bookController.donate);
router.get('/me/listings', bookController.myBooks);
router.patch('/:id', bookController.update);
router.patch('/:id/availability', bookController.setAvailability);

// Beneficiary requesting a specific book — nested under the book, mirrors
// POST /resources/:id/request.
router.post('/:id/request', bookRequestController.create);

module.exports = router;
