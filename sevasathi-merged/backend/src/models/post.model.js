const mongoose = require('mongoose');

const { Schema } = mongoose;

// Matches the type badge (Story / Update / Highlight) on the feed card
const POST_TYPES = ['story', 'update', 'highlight'];

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: POST_TYPES,
      default: 'story',
    },

    text: {
      type: String,
      trim: true,
      required: [true, 'Post text is required'],
      maxlength: 2000,
    },

    // Optional image attached to the post (URL to uploaded/hosted file)
    imageUrl: {
      type: String,
      default: null,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, trim: true, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    city: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ type: 1 });

// ---------- Virtuals ----------
postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});
postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});
postSchema.set('toJSON', { virtuals: true });

// ---------- Instance methods ----------
postSchema.methods.toggleLike = function (userId) {
  const idx = this.likes.findIndex((id) => id.toString() === userId.toString());
  if (idx === -1) {
    this.likes.push(userId);
    return { liked: true, post: this };
  }
  this.likes.splice(idx, 1);
  return { liked: false, post: this };
};

postSchema.methods.addComment = function (userId, text) {
  this.comments.push({ user: userId, text });
  return this;
};

const Post = mongoose.model('Post', postSchema);

module.exports = { Post, POST_TYPES };
