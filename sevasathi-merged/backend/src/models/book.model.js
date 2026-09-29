const mongoose = require('mongoose');

const { Schema } = mongoose;

const BOOK_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'worn'];

const BOOK_CATEGORIES = [
  'textbook',
  'competitive_exam',
  'fiction',
  'non_fiction',
  'children',
  'reference',
  'other',
];

const BOOK_LANGUAGES = [
  'english',
  'hindi',
  'bengali',
  'tamil',
  'telugu',
  'marathi',
  'gujarati',
  'kannada',
  'malayalam',
  'punjabi',
  'urdu',
  'other',
];

// Two meaningful states for the *listing* itself. The richer per-request
// lifecycle (requested/approved/collected/completed/rejected/cancelled)
// lives on BookRequest — see bookrequest.model.js. A listing is simply
// 'available' while at least one copy is free to request, or
// 'unavailable' once every copy is reserved/given away or the donor
// pauses it. Derived automatically in the pre-save hook below so it can
// never drift out of sync with availableQuantity/isActive.
const BOOK_STATUS = ['available', 'unavailable'];

const bookSchema = new Schema(
  {
    // Whoever is giving the book away. A separate Book collection (rather
    // than the old embedded booksOffered[] on BookDonor) is used so each
    // listing is independently searchable/filterable and so quantity can
    // be updated atomically without loading/rewriting a whole donor doc.
    donor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    category: {
      type: String,
      enum: BOOK_CATEGORIES,
      default: 'other',
    },
    language: {
      type: String,
      enum: BOOK_LANGUAGES,
      default: 'english',
    },
    condition: {
      type: String,
      enum: BOOK_CONDITIONS,
      default: 'good',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Image URLs only — the project has no file-upload/storage layer
    // (avatarUrl on User follows the same string-URL convention), so
    // this stays consistent with existing patterns rather than adding
    // new infra.
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 6,
        message: 'A book listing can have at most 6 images',
      },
    },

    // Total physical copies offered, and how many are still unclaimed.
    // availableQuantity is only ever changed via atomic $inc updates in
    // bookrequest.service.js — that's what prevents two beneficiaries
    // from claiming the same physical copy.
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    availableQuantity: {
      type: Number,
      default: 1,
      min: 0,
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
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    status: {
      type: String,
      enum: BOOK_STATUS,
      default: 'available',
    },

    // Donor can pause/withdraw a listing without deleting it, preserving
    // history for any past requests against it.
    isActive: {
      type: Boolean,
      default: true,
    },

    totalRequests: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Keep status derived, never hand-set ----------
bookSchema.pre('save', function (next) {
  this.status = this.isActive && this.availableQuantity > 0 ? 'available' : 'unavailable';
  next();
});

// ---------- Indexes ----------
bookSchema.index({ location: '2dsphere' }, { sparse: true });
bookSchema.index({ category: 1, language: 1, condition: 1, status: 1 });
bookSchema.index({ pincode: 1 });
bookSchema.index({ donor: 1, createdAt: -1 });
bookSchema.index({ title: 1 });
bookSchema.index({ isbn: 1 });

const Book = mongoose.model('Book', bookSchema);

module.exports = { Book, BOOK_CONDITIONS, BOOK_CATEGORIES, BOOK_LANGUAGES, BOOK_STATUS };
