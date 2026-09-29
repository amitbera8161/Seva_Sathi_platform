const mongoose = require('mongoose');

const { Schema } = mongoose;

// Centralized enums — reuse in validators/frontend dropdowns too
const CAUSES = [
  'education',
  'healthcare',
  'food_relief',
  'disaster_response',
  'environment',
  'elderly_care',
  'child_welfare',
  'animal_welfare',
  'community_events',
];

const AVAILABILITY_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'weekend_only', 'flexible'];

const volunteerSchema = new Schema(
  {
    // Links this role-specific profile back to the base User doc.
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Free-text skills the volunteer offers (e.g. "teaching", "first aid",
    // "driving", "social media"). Kept as an array of strings for flexible
    // tagging/search without needing a rigid taxonomy upfront.
    skills: {
      type: [String],
      default: [],
      set: (arr) => arr.map((s) => s.trim().toLowerCase()).filter(Boolean),
    },

    // Causes the volunteer cares about / wants to be matched to
    causes: {
      type: [String],
      enum: CAUSES,
      default: [],
    },

    // When they're generally free — used to match against event timing
    availableDays: {
      type: [String],
      enum: AVAILABILITY_DAYS,
      default: [],
    },
    preferredTimeSlot: {
      type: String,
      enum: TIME_SLOTS,
      default: 'flexible',
    },

    // How far they're willing to travel for in-person events (in km)
    maxTravelDistanceKm: {
      type: Number,
      default: 10,
      min: 0,
      max: 500,
    },

    // Denormalized location for fast "volunteers near this event" queries
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

    // Short bio shown on volunteer profile / event applications
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    // Trust/engagement signals
    totalEventsAttended: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalHoursContributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerifiedVolunteer: {
      type: Boolean,
      default: false,
    },

    // Events the volunteer has signed up for / attended.
    // Kept as refs rather than embedding, since Event is its own collection.
    events: [
      {
        event: { type: Schema.Types.ObjectId, ref: 'Event' },
        status: {
          type: String,
          enum: ['applied', 'confirmed', 'attended', 'cancelled'],
          default: 'applied',
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

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
volunteerSchema.index({ location: '2dsphere' });
volunteerSchema.index({ causes: 1 });
volunteerSchema.index({ skills: 1 });
volunteerSchema.index({ pincode: 1 });

// ---------- Instance methods ----------
volunteerSchema.methods.applyToEvent = function (eventId) {
  const alreadyApplied = this.events.some(
    (e) => e.event.toString() === eventId.toString()
  );
  if (!alreadyApplied) {
    this.events.push({ event: eventId, status: 'applied' });
  }
  return this;
};

volunteerSchema.methods.markEventAttended = function (eventId, hours = 0) {
  const entry = this.events.find((e) => e.event.toString() === eventId.toString());
  if (entry) {
    entry.status = 'attended';
    this.totalEventsAttended += 1;
    this.totalHoursContributed += hours;
  }
  return this;
};

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = { Volunteer, CAUSES, AVAILABILITY_DAYS, TIME_SLOTS };