const mongoose = require('mongoose');

const { Schema } = mongoose;

// Lightweight donor-preferences profile. Actual book listings live in
// their own top-level `Book` collection (see book.model.js) — moved out
// of an embedded booksOffered[] array here so listings are independently
// searchable/filterable and their quantity can be updated atomically.
// This profile is optional context (contact method, delivery radius,
// default location) attached to a user the first time they donate a book.
const bookDonorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    preferredContactMethod: {
      type: String,
      enum: ['phone', 'email', 'in_app'],
      default: 'in_app',
    },

    willingToDeliver: {
      type: Boolean,
      default: false,
    },
    maxDeliveryDistanceKm: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Denormalized default location, used to prefill new book listings.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
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

    totalBooksDonated: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
bookDonorSchema.index({ location: '2dsphere' });
bookDonorSchema.index({ pincode: 1 });

const BookDonor = mongoose.model('BookDonor', bookDonorSchema);

module.exports = { BookDonor };
