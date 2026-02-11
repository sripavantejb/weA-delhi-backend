const express = require('express');
const { auth } = require('../middleware/auth');
const { getPosts, createPost, updatePost, deletePost } = require('../controllers/postController');

const router = express.Router();

router.use(auth);
router.get('/', getPosts);
router.post('/', createPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

module.exports = router;
