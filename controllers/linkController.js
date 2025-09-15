const mongoose = require('mongoose');
const Link = require('../models/Link');
const { ApiError } = require('../middleware/errorMiddleware');

// @desc    Get user's links
// @route   GET /api/links
// @access  Private
exports.getLinks = async (req, res, next) => {
  try {
    const { search, tag, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const result = await Link.getUserLinks(userId, {
      search,
      tag,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new link
// @route   POST /api/links
// @access  Private
exports.addLink = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const link = await Link.create(req.body);

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a link
// @route   PATCH /api/links/:id
// @access  Private
exports.updateLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let link = await Link.findById(id);

    if (!link) {
      throw new ApiError(404, `Link not found with id of ${id}`);
    }

    // Make sure user is link owner
    if (link.user.toString() !== userId) {
      throw new ApiError(401, `User not authorized to update this link`);
    }

    // Update fields
    const fieldsToUpdate = {};
    const allowedFields = ['url', 'title', 'description', 'tags'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    link = await Link.findByIdAndUpdate(id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a link
// @route   DELETE /api/links/:id
// @access  Private
exports.deleteLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const link = await Link.findById(id);

    if (!link) {
      throw new ApiError(404, `Link not found with id of ${id}`);
    }

    // Make sure user is link owner
    if (link.user.toString() !== userId) {
      throw new ApiError(401, `User not authorized to delete this link`);
    }

    await link.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique tags for a user
// @route   GET /api/links/tags
// @access  Private
exports.getTags = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const tags = await Link.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags.map(tag => ({
        name: tag._id,
        count: tag.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};
