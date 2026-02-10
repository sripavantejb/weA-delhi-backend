const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.list);
router.get('/:id', userController.getById);

module.exports = router;
