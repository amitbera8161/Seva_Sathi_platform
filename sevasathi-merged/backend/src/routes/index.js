const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const bloodDonorRoutes = require('./blooddonor.routes');
const bloodRequestRoutes = require('./bloodrequest.routes');
const volunteerRoutes = require('./volunteer.routes');
const ngoRoutes = require('./ngo.routes');
const bookDonorRoutes = require('./bookdonor.routes');
const bookRoutes = require('./book.routes');
const bookRequestRoutes = require('./bookrequest.routes');
const emergencyRequestRoutes = require('./emergencyrequest.routes');
const resourceRoutes = require('./resource.routes');
const postRoutes = require('./post.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/blood-donors', bloodDonorRoutes);
router.use('/blood-requests', bloodRequestRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/ngos', ngoRoutes);
router.use('/book-donors', bookDonorRoutes);
router.use('/books', bookRoutes);
router.use('/book-requests', bookRequestRoutes);
router.use('/emergency-requests', emergencyRequestRoutes);
router.use('/resources', resourceRoutes);
router.use('/posts', postRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;

// Mount in app.js as:
// const routes = require('./routes');
// app.use('/api/v1', routes);
