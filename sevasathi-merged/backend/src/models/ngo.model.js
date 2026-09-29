const mongoose = require('mongoose');

const { Schema } = mongoose;

const ORG_TYPES = [
  'ngo',
  'nss_unit',
  'trust',
  'community_group',
  'religious_organization',
  'educational_institution',
  'other',
];

const VERIFICATION_STATUS = ['pending', 'under_review', 'verified', 'rejected'];

const ngoSchema = new Schema(
  {
    // Links this role-specific profile back to the base User doc.
    // The user who registered the NGO acts as its primary admin/contact.
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    orgName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 150,
    },

    orgType: {
      type: String,
      enum: ORG_TYPES,
      required: [true, 'Organization type is required'],
    },

    // Registration/license number — e.g. NGO Darpan ID, 12A/80G, trust
    // registration number, or NSS unit code. Kept as a generic string
    // since format varies by org type.
    registrationNumber: {
      type: String,
      trim: true,
      required: [true, 'Registration number is required'],
    },

    // Supporting documents uploaded for verification
    // (registration certificate, PAN, 80G certificate, etc.)
    verificationDocuments: [
      {
        docType: {
          type: String,
          enum: ['registration_certificate', 'pan_card', '80g_certificate', 'other'],
          default: 'other',
        },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUS,
      default: 'pending',
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid contact email'],
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },

    // Address / location for "NGOs near you" and event hosting
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
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    logoUrl: {
      type: String,
      default: null,
    },

    // Events/drives this NGO has organized on the platform
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],

    // Trust/engagement signals shown on public NGO profile
    totalEventsOrganized: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVolunteersEngaged: {
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
ngoSchema.index({ location: '2dsphere' });
ngoSchema.index({ verificationStatus: 1 });
ngoSchema.index({ orgType: 1 });
ngoSchema.index({ pincode: 1 });
// Registration numbers must be unique across NGOs to prevent duplicate/fraudulent registrations
ngoSchema.index({ registrationNumber: 1 }, { unique: true });

const NGO = mongoose.model('NGO', ngoSchema);

module.exports = { NGO, ORG_TYPES, VERIFICATION_STATUS };