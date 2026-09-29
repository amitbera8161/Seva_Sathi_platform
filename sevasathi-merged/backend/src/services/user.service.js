const { User, ROLES } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function updateProfile(userId, updates) {
  const editableFields = ['fullName', 'city', 'pincode', 'avatarUrl'];

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  }

  await user.save();
  return user;
}

// "You can always add more roles later from your profile" — the flow
// shown on the role-selection screen. Adding a role here does NOT create
// the role-specific profile (e.g. BloodDonor doc) — that still needs the
// corresponding /blood-donor, /volunteer, /ngo, or /book-donor registration
// endpoint to be called with the actual details.
async function addRole(userId, role) {
  if (!ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role: ${role}`);
  }

  // The admin role has no public registration path — it must be granted
  // out-of-band (see backend/scripts/grant-admin.js), never through this
  // self-service endpoint.
  if (role === 'admin') {
    throw new ApiError(403, 'The admin role cannot be self-assigned');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.roles.includes(role)) {
    throw new ApiError(409, `User already has the ${role} role`);
  }

  user.roles.push(role);
  await user.save();

  return user;
}

async function removeRole(userId, role) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.roles.length === 1 && user.roles[0] === role) {
    throw new ApiError(400, 'User must have at least one role');
  }

  user.roles = user.roles.filter((r) => r !== role);
  await user.save();

  return user;
}

async function deactivateAccount(userId) {
  const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

module.exports = {
  getProfile,
  updateProfile,
  addRole,
  removeRole,
  deactivateAccount,
};