const mongoose = require('mongoose');

const { Schema } = mongoose;

// Matches the category chips on the Emergency Requests page
// (blood / food / medicine / shelter / transport / education / other)
const CATEGORIES = ['blood', 'food', 'medicine', 'shelter', 'transport', 'education', 'other'];

const SEVERITY = ['critical', 'moderate'];
const STATUS = ['open', 'resolved'];

const emergencyRequestSchema = new Schema(
  {
    // Who raised the request — any logged-in user (individual, NGO, etc.)
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
      required: [true, 'Description is required'],
      maxlength: 1000,
    },

    severity: {
      type: String,
      enum: SEVERITY,
      default: 'moderate',
    },
    status: {
      type: String,
      enum: STATUS,
      default: 'open',
    },

    // Contact number shown to helpers who respond — optional, falls back
    // to the poster's profile phone if not provided.
    contactPhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },

    address: {
      type: String,
      trim: true,
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    // People who've offered to help — drives the "N helpers" counter
    // and lets the UI show "✓ You're helping" for the current user.
    helpers: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        respondedAt: { type: Date, default: Date.now },
      },
    ],

    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
emergencyRequestSchema.index({ location: '2dsphere' }, { sparse: true });
emergencyRequestSchema.index({ status: 1, severity: 1, createdAt: -1 });
emergencyRequestSchema.index({ category: 1 });
emergencyRequestSchema.index({ pincode: 1 });

// ---------- Instance methods ----------
emergencyRequestSchema.methods.addHelper = function (userId) {
  const already = this.helpers.some((h) => h.user.toString() === userId.toString());
  if (!already) {
    this.helpers.push({ user: userId });
  }
  return this;
};

emergencyRequestSchema.methods.removeHelper = function (userId) {
  this.helpers = this.helpers.filter((h) => h.user.toString() !== userId.toString());
  return this;
};

emergencyRequestSchema.methods.markResolved = function (userId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId || null;
  return this;
};

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);

module.exports = { EmergencyRequest, CATEGORIES, SEVERITY, STATUS };
