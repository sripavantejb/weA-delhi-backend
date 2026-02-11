const express = require('express');
const homeRoutes = require('./homeRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const contentPlanRoutes = require('./contentPlanRoutes');
const postRoutes = require('./postRoutes');

const router = express.Router();

router.use('/', homeRoutes);
router.use('/api/users', userRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/content-plan', contentPlanRoutes);
router.use('/api/posts', postRoutes);

module.exports = router;
