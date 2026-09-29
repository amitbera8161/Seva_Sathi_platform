const { BookDonor } = require('../models/bookdonor.model');
const { User } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');

async function registerBookDonor(userId, payload) {
  const { preferredContactMethod, willingToDeliver, maxDeliveryDistanceKm, city, pincode } = payload;

  const existing = await BookDonor.findOne({ user: userId });
  if (existing) {
    throw new ApiError(409, 'Book donor profile already exists for this user');
  }

  const donor = await BookDonor.create({
    user: userId,
    preferredContactMethod,
    willingToDeliver,
    maxDeliveryDistanceKm,
    city,
    pincode,
  });

  await User.findByIdAndUpdate(userId, { $addToSet: { roles: 'book_donor' } });

  return donor;
}

async function getMyDonorProfile(userId) {
  const donor = await BookDonor.findOne({ user: userId });
  if (!donor) throw new ApiError(404, 'Book donor profile not found');
  return donor;
}

async function updateDonorProfile(userId, updates) {
  const donor = await getMyDonorProfile(userId);

  const editableFields = ['preferredContactMethod', 'willingToDeliver', 'maxDeliveryDistanceKm', 'city', 'pincode'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) donor[field] = updates[field];
  }

  await donor.save();
  return donor;
}

// Used by book.service.js when someone donates their first book — a
// separate profile-creation step shouldn't be required just to list a
// book, so this transparently creates a minimal profile (or returns the
// existing one) and grants the 'book_donor' role, same as
// registerBookDonor above.
async function getOrCreateDonorProfile(userId, defaults = {}) {
  const donor = await BookDonor.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, city: defaults.city, pincode: defaults.pincode } },
    { upsert: true, new: true }
  );
  await User.findByIdAndUpdate(userId, { $addToSet: { roles: 'book_donor' } });
  return donor;
}

module.exports = {
  registerBookDonor,
  getMyDonorProfile,
  updateDonorProfile,
  getOrCreateDonorProfile,
};
