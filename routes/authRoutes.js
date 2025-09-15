const express = require('express');
const { check } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post(
  '/signup',
  [
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  validateRequest,
  login
);

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.post('/logout', logout);

module.exports = router;
