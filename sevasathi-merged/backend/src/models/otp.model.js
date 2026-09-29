const mongoose = require('mongoose');

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Store whichever identifier the OTP was sent to
    email: { type: String, default: null },
    phone: { type: String, default: null },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ['email_verification', 'phone_verification', 'password_reset'],
      default: 'email_verification',
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// OTP documents auto-delete 10 minutes after creation — TTL index.
// Keeps the collection clean without a manual cleanup job.
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = { Otp };