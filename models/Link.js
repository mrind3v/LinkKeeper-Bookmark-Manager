const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a user ID'],
    },
    url: {
      type: String,
      required: [true, 'Please add a URL'],
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS',
      ],
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10; // Limit number of tags
        },
        message: 'Cannot have more than 10 tags',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for text search
linkSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Prevent duplicate links for the same user
linkSchema.index({ user: 1, url: 1 }, { unique: true });

// Static method to get paginated links with search and filter
linkSchema.statics.getUserLinks = async function (userId, { search, tag, page = 1, limit = 10 }) {
  const query = { user: userId };
  
  // Add search condition
  if (search) {
    query.$text = { $search: search };
  }
  
  // Add tag filter
  if (tag) {
    query.tags = tag;
  }
  
  const skip = (page - 1) * limit;
  
  const [links, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    this.countDocuments(query),
  ]);
  
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;
  
  return {
    success: true,
    count: links.length,
    page,
    totalPages,
    hasMore,
    data: links,
  };
};

module.exports = mongoose.model('Link', linkSchema);
