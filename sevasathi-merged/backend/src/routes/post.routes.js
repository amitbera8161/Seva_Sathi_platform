const express = require('express');
const postController = require('../controllers/post.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public — the feed is browsable logged out, like the rest of the app
router.get('/', optionalAuth, postController.list);
router.get('/:id', optionalAuth, postController.getById);

router.use(requireAuth); // everything below requires login

router.post('/', postController.create);
router.post('/:id/like', postController.toggleLike);
router.post('/:id/comments', postController.addComment);
router.delete('/:id', postController.remove);

module.exports = router;
