const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

// 'admin' is intentionally included here so requireRole('admin') and the
// role-based dashboard routing can recognize it — but it is NEVER
// self-assignable. See user.service.js#addRole: it explicitly blocks
// 'admin' from being added through the public /users/me/roles endpoint.
// Grant it out-of-band only, e.g. via backend/scripts/grant-admin.js.
const ROLES = ['regular_user', 'blood_donor', 'volunteer', 'ngo', 'book_donor', 'admin'];

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, 'Full name is required'],
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows phone-only accounts with no email
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },

    // Not required at the schema level — Google OAuth accounts have no
    // local password. Presence is enforced in auth.service.js for
    // local signups instead.
    password: {
      type: String,
      minlength: 8,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },

    roles: {
      type: [String],
      enum: ROLES,
      default: ['regular_user'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A user must have at least one role',
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

    avatarUrl: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ---------- Require email OR phone ----------
userSchema.pre('validate', function () {
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone is required');
  }
});

// ---------- Hash password before save ----------
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ---------- Instance methods ----------
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only account, no local password
  return bcrypt.compare(candidatePassword, this.password);
};

// ---------- Strip sensitive fields from JSON output ----------
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };