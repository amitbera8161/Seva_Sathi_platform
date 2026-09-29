const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const { User } = require('../models/user.model');
const { Otp } = require('../models/otp.model');
const { Session } = require('../models/session.model');
const { ApiError } = require('../utils/apierror');
const { sendEmail } = require('./email.service'); // assumed existing util
const config = require('../config/env');

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function issueTokens(userId, sessionId) {
  const accessToken = jwt.sign({ id: userId, sessionId }, config.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  return { accessToken, refreshToken };
}

// ---------- Signup ----------
async function signup({ fullName, email, phone, password }) {
  const existing = await User.findOne({
    $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean),
  });

  if (existing) {
    throw new ApiError(409, 'Email or phone already registered');
  }

  const user = await User.create({ fullName, email, phone, password });

  if (email) {
    await sendVerificationOtp(user, 'email_verification');
  }

  return user;
}

// ---------- OTP ----------
// ---------- OTP ----------
async function sendVerificationOtp(user, purpose = 'email_verification') {
  const otp = generateOtp();
  const otpHash = hashToken(otp);

  await Otp.create({
    user: user._id,
    email: user.email || null,
    phone: user.phone || null,
    otpHash,
    purpose,
  });

  if (user.email) {
    try {
      await sendEmail(
        user.email,
        'Verify your SevaSathi account',
        `Your OTP is ${otp}. It expires in 10 minutes.`
      );
    } catch (err) {
      if (config.NODE_ENV !== 'production') {
        console.log(`[auth.service] Email delivery failed, OTP for ${user.email}: ${otp}`);
      } else {
        console.error(`[auth.service] OTP email delivery failed for user ${user._id}:`, err.message);
      }
    }
  }
  // SMS branch would go here for phone-based OTP delivery
}

async function verifyOtp({ userId, otp, purpose = 'email_verification' }) {
  const otpHash = hashToken(otp);

  const otpDoc = await Otp.findOne({ user: userId, otpHash, purpose });

  if (!otpDoc) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isVerified: true },
    { new: true }
  );

  await Otp.deleteMany({ user: userId, purpose });

  return user;
}

async function resendOtp(userId, purpose = 'email_verification') {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  await Otp.deleteMany({ user: userId, purpose });
  await sendVerificationOtp(user, purpose);
}

// ---------- Login ----------
async function login({ identifier, password, ip, userAgent }) {
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.authProvider === 'google') {
    throw new ApiError(400, 'This account uses Google sign-in. Please continue with Google.');
  }

  if (!user.isVerified) {
    throw new ApiError(401, 'Account not verified. Please verify your email/phone first.');
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const session = await Session.create({ user: user._id, ip, userAgent, refreshTokenHash: 'pending' });

  const { accessToken, refreshToken } = issueTokens(user._id, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
}

// ---------- Google OAuth ----------
async function loginWithGoogle({ idToken, ip, userAgent }) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new ApiError(400, 'Invalid Google token');
  }

  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email }],
  });

  if (!user) {
    user = await User.create({
      fullName: payload.name || 'SevaSathi User',
      email: payload.email,
      authProvider: 'google',
      googleId: payload.sub,
      avatarUrl: payload.picture || null,
      isVerified: true, // Google already verified the email
    });
  } else if (!user.googleId) {
    // Existing local account signing in with Google for the first time —
    // link the accounts rather than creating a duplicate
    user.googleId = payload.sub;
    user.authProvider = 'google';
    await user.save();
  }

  const session = await Session.create({ user: user._id, ip, userAgent, refreshTokenHash: 'pending' });
  const { accessToken, refreshToken } = issueTokens(user._id, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
}

// ---------- Token refresh ----------
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'Refresh token not found');

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const refreshTokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash, revoked: false });

  if (!session) {
    throw new ApiError(401, 'Session not found or revoked');
  }

  const { accessToken, refreshToken: newRefreshToken } = issueTokens(decoded.id, session._id);
  session.refreshTokenHash = hashToken(newRefreshToken);
  await session.save();

  return { accessToken, refreshToken: newRefreshToken };
}

// ---------- Logout ----------
async function logout(refreshToken) {
  if (!refreshToken) throw new ApiError(400, 'Refresh token not found');

  const refreshTokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash, revoked: false });

  if (!session) throw new ApiError(400, 'Invalid refresh token');

  session.revoked = true;
  await session.save();
}

async function logoutAll(refreshToken) {
  if (!refreshToken) throw new ApiError(400, 'Refresh token not found');

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  await Session.updateMany({ user: decoded.id, revoked: false }, { revoked: true });
}

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  loginWithGoogle,
  refreshAccessToken,
  logout,
  logoutAll,
  REFRESH_TOKEN_TTL_MS,
};