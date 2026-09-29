const mongoose = require('mongoose');

const { Schema } = mongoose;

// Matches the category filter chips on the Resource Exchange page
const CATEGORIES = ['food', 'books', 'clothes', 'medicine', 'tuition', 'other'];

const resourceSchema = new Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },

    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Invalid pincode'],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    // People who've asked for this resource — "Request This" on the card.
    // Kept as a sub-array (not a separate collection) since request volume
    // per resource is expected to stay small.
    requests: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, trim: true, maxlength: 300, default: '' },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
resourceSchema.index({ category: 1, isAvailable: 1, createdAt: -1 });
resourceSchema.index({ pincode: 1 });
resourceSchema.index({ postedBy: 1 });

// ---------- Instance methods ----------
resourceSchema.methods.requestResource = function (userId, message = '') {
  const already = this.requests.some((r) => r.user.toString() === userId.toString());
  if (already) return this;
  this.requests.push({ user: userId, message });
  return this;
};

resourceSchema.methods.setRequestStatus = function (userId, status) {
  const entry = this.requests.find((r) => r.user.toString() === userId.toString());
  if (entry) entry.status = status;
  return this;
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = { Resource, CATEGORIES };
