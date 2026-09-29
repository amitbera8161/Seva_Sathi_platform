const mongoose = require('mongoose');

const { Schema } = mongoose;
const { BLOOD_GROUPS } = require('./blooddonor.model');

// Real-world peer-to-peer flow (no mandatory NGO/admin approval):
//
// pending -> matched -> accepted (partially staffed, unitsRequired > 1)
//         -> in_progress (fully staffed — every unit has an accepted donor)
//         -> waiting_confirmation (one side confirmed, not both yet)
//         -> completed (patient AND every accepted donor confirmed)
//
// pending/matched -> expired  (nobody accepted before the priority-based
//                               staleness window elapsed — see service)
// any non-terminal -> cancelled (patient or admin)
const BLOOD_REQUEST_STATUS = [
  'pending',
  'matched',
  'accepted',
  'in_progress',
  'waiting_confirmation',
  'completed',
  'cancelled',
  'expired',
];

// Renamed from "urgency" to "priority" to match how it's used: it drives
// notification/list ordering (critical surfaces first), not just labeling.
const BLOOD_REQUEST_PRIORITY = ['normal', 'urgent', 'critical'];

const MATCH_RESPONSE_STATUS = ['pending', 'accepted', 'rejected', 'expired'];

// One entry per donor the auto-matcher surfaced for this request.
const matchedDonorSchema = new Schema(
  {
    donor: { type: Schema.Types.ObjectId, ref: 'BloodDonor', required: true },
    // Denormalized so the UI/history can render "who was matched" without
    // an extra populate hop through BloodDonor -> User.
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: MATCH_RESPONSE_STATUS, default: 'pending' },
    matchedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    // 'exact'      -> donor's blood group is an exact match to the request
    // 'compatible' -> donor was only reached because exact-tier matches
    //                 didn't meet demand (see bloodrequest.service.js#findMatchingDonors)
    // Additive field: defaults to 'exact' so existing documents (written
    // before this field existed) and any existing reader that ignores it
    // both behave exactly as before.
    matchTier: { type: String, enum: ['exact', 'compatible'], default: 'exact' },
  },
  { _id: false }
);

// A donor who has actually committed to donate. Multiple entries are
// possible when unitsRequired > 1 — several donors can accept
// concurrently, each covering one unit, so patients with multi-unit
// needs aren't stuck waiting for a single donor to cover everything.
const acceptedDonorSchema = new Schema(
  {
    donor: { type: Schema.Types.ObjectId, ref: 'BloodDonor', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eta: { type: String, trim: true, maxlength: 100, default: '' }, // e.g. "30 mins"
    acceptedAt: { type: Date, default: Date.now },
    // Set once this specific donor confirms the donation happened.
    // Completion requires every entry here to be confirmed, AND the
    // patient to confirm — see bloodrequest.service.js#confirmDonation.
    donorConfirmedAt: { type: Date, default: null },
  },
  { _id: false }
);

// Append-only lifecycle log — this is what "blood request history" is
// built from, alongside the /me/requests and /me/donor-matches listings.
const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: BLOOD_REQUEST_STATUS, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const bloodRequestSchema = new Schema(
  {
    // Whoever raised the request — the patient or someone requesting on
    // their behalf. Any authenticated user, same pattern as
    // EmergencyRequest.postedBy.
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: [true, 'Blood group is required'],
    },
    unitsRequired: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },
    priority: {
      type: String,
      enum: BLOOD_REQUEST_PRIORITY,
      default: 'urgent',
    },

    hospitalName: {
      type: String,
      trim: true,
      required: [true, 'Hospital name is required'],
      maxlength: 150,
    },
    hospitalAddress: {
      type: String,
      trim: true,
      maxlength: 300,
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
    // Optional precise point — populated once the frontend captures real
    // geolocation; matching gracefully falls back to pincode/city until then.
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

    contactPhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    status: {
      type: String,
      enum: BLOOD_REQUEST_STATUS,
      default: 'pending',
    },

    matchedDonors: [matchedDonorSchema],
    acceptedDonors: [acceptedDonorSchema],

    // Set the first time the patient confirms a donation happened.
    // Paired with each acceptedDonors[].donorConfirmedAt — completion
    // requires all of them.
    patientConfirmedAt: { type: Date, default: null },

    completedAt: { type: Date, default: null },

    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, trim: true, default: '' },

    expiredAt: { type: Date, default: null },

    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// ---------- Indexes ----------
bloodRequestSchema.index({ location: '2dsphere' }, { sparse: true });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ patient: 1, createdAt: -1 });
bloodRequestSchema.index({ pincode: 1 });
bloodRequestSchema.index({ 'matchedDonors.user': 1 });
bloodRequestSchema.index({ 'acceptedDonors.user': 1 });
bloodRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = {
  BloodRequest,
  BLOOD_REQUEST_STATUS,
  BLOOD_REQUEST_PRIORITY,
  MATCH_RESPONSE_STATUS,
};
