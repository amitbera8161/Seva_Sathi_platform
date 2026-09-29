const mongoose = require('mongoose');

const { Schema } = mongoose;

// A beneficiary's claim on one or more copies of a Book listing.
//
//   requested -> approved -> collected -> completed
//   requested/approved -> rejected | cancelled
//   requested/approved -> unavailable  (listing withdrawn by donor while
//                                        this request was still open)
//
// Unlike BloodRequest (auto-matching, no mandatory approval), a Book
// request always needs the donor's explicit approval — see spec:
// "Beneficiary requests a book / Donor approves/rejects".
const BOOK_REQUEST_STATUS = [
  'requested',
  'approved',
  'rejected',
  'collected',
  'completed',
  'cancelled',
  'unavailable',
];

// Append-only lifecycle log — same pattern as bloodrequest.model.js — this
// is what "request and donation history" is built from.
const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: BOOK_REQUEST_STATUS, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const bookRequestSchema = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },

    // Denormalized so cards/history render without an extra populate hop
    // through Book -> donor — same reasoning as matchedDonorSchema.user
    // in bloodrequest.model.js. Snapshotted at request time.
    donor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    beneficiary: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    quantityRequested: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    donorNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    status: {
      type: String,
      enum: BOOK_REQUEST_STATUS,
      default: 'requested',
    },

    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    collectedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, trim: true, default: '' },

    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
bookRequestSchema.index({ book: 1, status: 1 });
bookRequestSchema.index({ beneficiary: 1, createdAt: -1 });
bookRequestSchema.index({ donor: 1, status: 1, createdAt: -1 });

const BookRequest = mongoose.model('BookRequest', bookRequestSchema);

module.exports = { BookRequest, BOOK_REQUEST_STATUS };
