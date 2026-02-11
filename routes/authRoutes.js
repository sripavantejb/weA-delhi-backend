const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { LoginActivity } = require('../models');
const { success, error } = require('../views/response');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return error(res, 'Name, email and password are required', 400);
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return error(res, 'Email already registered', 400);
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return success(res, { user: user.toJSON(), token }, 201);
  } catch (err) {
    console.error(err);
    const message = err.message === 'next is not a function'
      ? 'Registration failed. Please try again.'
      : (err.message || 'Registration failed');
    return error(res, message, 500);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 400);
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) return error(res, 'Invalid credentials', 401);
    const valid = await user.comparePassword(password);
    if (!valid) return error(res, 'Invalid credentials', 401);
    await LoginActivity.create({ user: user._id });
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return success(res, { user: user.toJSON(), token });
  } catch (err) {
    console.error(err);
    return error(res, err.message || 'Login failed', 500);
  }
});

module.exports = router;
