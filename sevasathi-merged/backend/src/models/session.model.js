const mongoose = require('mongoose');

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },

    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ user: 1, revoked: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = { Session };