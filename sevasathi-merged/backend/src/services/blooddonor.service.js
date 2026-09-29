const { BloodDonor } = require('../models/blooddonor.model');
const { User } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');
const { cityMatch } = require('../utils/textMatch');

async function registerBloodDonor(userId, payload) {
  const { bloodGroup, lastDonationDate, availableForEmergency, city, pincode } = payload;

  const existing = await BloodDonor.findOne({ user: userId });
  if (existing) {
    throw new ApiError(409, 'Blood donor profile already exists for this user');
  }

  const donor = await BloodDonor.create({
    user: userId,
    bloodGroup,
    lastDonationDate: lastDonationDate || null,
    availableForEmergency: !!availableForEmergency,
    city,
    pincode,
  });

  if (lastDonationDate) {
    donor.nextEligibleDate = addDays(new Date(lastDonationDate), 90);
    await donor.save();
  }

  await User.findByIdAndUpdate(userId, { $addToSet: { roles: 'blood_donor' } });

  return donor;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function getMyDonorProfile(userId) {
  const donor = await BloodDonor.findOne({ user: userId });
  if (!donor) throw new ApiError(404, 'Blood donor profile not found');
  return donor;
}

async function updateDonorProfile(userId, updates) {
  const donor = await getMyDonorProfile(userId);

  const editableFields = ['bloodGroup', 'availableForEmergency', 'city', 'pincode'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) donor[field] = updates[field];
  }

  await donor.save();
  return donor;
}

// Called when a donor confirms they've donated (e.g. after an emergency
// match or a scheduled camp) — updates streak + recalculates eligibility.
async function recordDonation(userId, donationDate = new Date()) {
  const donor = await getMyDonorProfile(userId);

  donor.lastDonationDate = donationDate;
  donor.nextEligibleDate = addDays(new Date(donationDate), 90);
  donor.totalDonations += 1;

  await donor.save();
  return donor;
}

// Search for eligible, emergency-willing donors by blood group + pincode —
// the core "find a donor fast" query the whole feature exists for.
async function findEmergencyDonors({ bloodGroup, pincode, city }) {
  const query = {
    bloodGroup,
    availableForEmergency: true,
    isActive: true,
    $or: [{ nextEligibleDate: null }, { nextEligibleDate: { $lte: new Date() } }],
  };

  if (pincode) query.pincode = pincode;
  else if (city) query.city = cityMatch(city);

  return BloodDonor.find(query).populate('user', 'fullName phone email');
}

// ---- Admin-only (requires the 'admin' role — see backend/scripts/grant-admin.js) ----

// Donors awaiting the "✓ Verified" badge shown on BloodNetworkPage. Newest
// first so recently-registered donors surface at the top of the review queue.
async function listUnverifiedDonors() {
  return BloodDonor.find({ isVerifiedDonor: false, isActive: true })
    .sort({ createdAt: -1 })
    .populate('user', 'fullName phone email city');
}

// Marks a donor as verified (e.g. after confirming ID / a past donation
// with the platform). One-way: there's no "unverify" flow, mirroring how
// NGO verification only exposes verify/reject, not revoke.
async function verifyDonor(donorId) {
  const donor = await BloodDonor.findById(donorId);
  if (!donor) throw new ApiError(404, 'Blood donor profile not found');

  donor.isVerifiedDonor = true;
  await donor.save();
  return donor;
}

module.exports = {
  registerBloodDonor,
  getMyDonorProfile,
  updateDonorProfile,
  recordDonation,
  findEmergencyDonors,
  listUnverifiedDonors,
  verifyDonor,
};