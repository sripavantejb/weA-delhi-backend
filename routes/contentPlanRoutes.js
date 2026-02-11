const express = require('express');
const { auth } = require('../middleware/auth');
const { generate, insert, polishCaption } = require('../controllers/contentPlanController');

const router = express.Router();

router.post('/generate', auth, generate);
router.post('/insert', auth, insert);
router.post('/polish-caption', auth, polishCaption);

module.exports = router;
