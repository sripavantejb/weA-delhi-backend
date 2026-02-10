const express = require('express');
const homeRoutes = require('./homeRoutes');
const userRoutes = require('./userRoutes');
const imageRoutes = require('./imageRoutes');

const router = express.Router();

router.use('/', homeRoutes);
router.use('/api/users', userRoutes);
router.use('/api/images', imageRoutes);

module.exports = router;
