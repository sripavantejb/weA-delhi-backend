const express = require('express');
const homeRoutes = require('./homeRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/', homeRoutes);
router.use('/api/users', userRoutes);

module.exports = router;
