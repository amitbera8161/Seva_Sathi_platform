const mongoose = require('mongoose');

const { Schema } = mongoose;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodDonorSchema = new Schema(
  {
    // Links this role-specific profile back to the base User doc.
    // One user -> one blood donor profile (enforced by unique index below).
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // "Blood Group" dropdown on the Details step
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: [true, 'Blood group is required'],
    },

    // "Last Donation Date" field — optional, since a first-time donor
    // may not have one yet
    lastDonationDate: {
      type: Date,
      default: null,
      validate: {
        validator: (date) => !date || date <= new Date(),
        message: 'Last donation date cannot be in the future',
      },
    },

    // "I am willing to be contacted for emergency requests" checkbox
    availableForEmergency: {
      type: Boolean,
      default: false,
    },

    // Derived/maintained field: donors must wait ~90 days between donations.
    // Recomputed whenever lastDonationDate changes (see pre-save hook).
    nextEligibleDate: {
      type: Date,
      default: null,
    },

    // Denormalized location for fast geo-matching without a join back to User.
    // Kept in sync via a service call when the user updates their profile.
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
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Invalid pincode'],
    },

    // Verification badge — e.g. after first confirmed donation via the platform
    isVerifiedDonor: {
      type: Boolean,
      default: false,
    },

    // Simple counter for donor recognition / trust signals on profile
    totalDonations: {
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
bloodDonorSchema.index({ location: '2dsphere' }, { sparse: true });
bloodDonorSchema.index({ bloodGroup: 1, availableForEmergency: 1 });
bloodDonorSchema.index({ pincode: 1 });

// ---------- Auto-calc next eligible donation date (90-day rule) ----------
bloodDonorSchema.pre('save', function () {
  if (this.isModified('lastDonationDate') && this.lastDonationDate) {
    const next90 = new Date(this.lastDonationDate);
    next90.setDate(next90.getDate() + 90);
    this.nextEligibleDate = next90;
  }
});

// ---------- Instance methods ----------
bloodDonorSchema.methods.isEligibleToDonate = function () {
  if (!this.nextEligibleDate) return true; // never donated before
  return new Date() >= this.nextEligibleDate;
};

bloodDonorSchema.methods.recordDonation = function (donationDate = new Date()) {
  this.lastDonationDate = donationDate;
  this.totalDonations += 1;
  return this; // caller is responsible for awaiting .save()
};

const BloodDonor = mongoose.model('BloodDonor', bloodDonorSchema);

module.exports = { BloodDonor, BLOOD_GROUPS };