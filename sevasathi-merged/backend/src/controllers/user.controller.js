const userService = require('../services/user.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  res.status(200).json({
    message: 'Profile fetched successfully',
    user,
  });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  res.status(200).json({
    message: 'Profile updated successfully',
    user,
  });
});

exports.addRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await userService.addRole(req.user.id, role);

  res.status(200).json({
    message: `${role} role added successfully`,
    user,
  });
});

exports.removeRole = asyncHandler(async (req, res) => {
  const { role } = req.params;

  const user = await userService.removeRole(req.user.id, role);

  res.status(200).json({
    message: `${role} role removed successfully`,
    user,
  });
});

exports.deactivateAccount = asyncHandler(async (req, res) => {
  await userService.deactivateAccount(req.user.id);

  res.status(200).json({ message: 'Account deactivated successfully' });
});