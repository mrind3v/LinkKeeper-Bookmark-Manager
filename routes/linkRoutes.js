const express = require('express');
const { check } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const {
  getLinks,
  addLink,
  updateLink,
  deleteLink,
  getTags,
} = require('../controllers/linkController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(
    [
      check('page', 'Page must be a number').optional().isInt({ min: 1 }),
      check('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 100 }),
    ],
    validateRequest,
    getLinks
  )
  .post(
    [
      check('url', 'Please include a valid URL').isURL(),
      check('title', 'Please add a title').not().isEmpty(),
      check('description', 'Description cannot be more than 500 characters')
        .optional()
        .isLength({ max: 500 }),
      check('tags', 'Tags must be an array of strings')
        .optional()
        .isArray(),
      check('tags.*', 'Each tag must be a string')
        .optional()
        .isString()
        .trim()
        .notEmpty(),
    ],
    validateRequest,
    addLink
  );

router
  .route('/:id')
  .patch(
    [
      check('url', 'Please include a valid URL').optional().isURL(),
      check('title', 'Title cannot be empty').optional().not().isEmpty(),
      check('description', 'Description cannot be more than 500 characters')
        .optional()
        .isLength({ max: 500 }),
      check('tags', 'Tags must be an array of strings')
        .optional()
        .isArray(),
      check('tags.*', 'Each tag must be a string')
        .optional()
        .isString()
        .trim()
        .notEmpty(),
    ],
    validateRequest,
    updateLink
  )
  .delete(deleteLink);

// Get all unique tags for a user
router.get('/tags', getTags);

module.exports = router;
