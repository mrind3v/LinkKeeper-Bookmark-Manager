const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorMiddleware');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Create user
    const user = await User.create({
      email,
      password,
    });

    // Create token
    const token = generateToken(user._id, user.email);
    
    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Create token
    const token = generateToken(user._id, user.email);
    
    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
    
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// Generate JWT token
const generateToken = (id, email) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// Set token cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // Only send over HTTPS in production
    cookieOptions.sameSite = 'none';
  }

  res.cookie('token', token, cookieOptions);
};
