const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/asynchandler');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: authService.REFRESH_TOKEN_TTL_MS,
};

exports.signup = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const user = await authService.signup({ fullName, email, phone, password });

  res.status(201).json({
    message: 'Signup successful. Please verify your account with the OTP sent to you.',
    user,
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp, purpose } = req.body;

  const user = await authService.verifyOtp({ userId, otp, purpose });

  res.status(200).json({
    message: 'Account verified successfully',
    user,
  });
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const { userId, purpose } = req.body;

  await authService.resendOtp(userId, purpose);

  res.status(200).json({ message: 'OTP resent successfully' });
});

exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    identifier,
    password,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    message: 'Logged in successfully',
    user,
    accessToken,
  });
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  const { user, accessToken, refreshToken } = await authService.loginWithGoogle({
    idToken,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    message: 'Logged in with Google successfully',
    user,
    accessToken,
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refreshAccessToken(
    req.cookies.refreshToken
  );

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    message: 'Access token refreshed successfully',
    accessToken,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.refreshToken);

  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.cookies.refreshToken);

  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out from all devices successfully' });
});