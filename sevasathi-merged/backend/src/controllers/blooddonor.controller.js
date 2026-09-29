const bloodDonorService = require('../services/blooddonor.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.register = asyncHandler(async (req, res) => {
  const donor = await bloodDonorService.registerBloodDonor(req.user.id, req.body);

  res.status(201).json({
    message: 'Blood donor profile created successfully',
    donor,
  });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const donor = await bloodDonorService.getMyDonorProfile(req.user.id);

  res.status(200).json({
    message: 'Blood donor profile fetched successfully',
    donor,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const donor = await bloodDonorService.updateDonorProfile(req.user.id, req.body);

  res.status(200).json({
    message: 'Blood donor profile updated successfully',
    donor,
  });
});

exports.recordDonation = asyncHandler(async (req, res) => {
  const { donationDate } = req.body;

  const donor = await bloodDonorService.recordDonation(req.user.id, donationDate);

  res.status(200).json({
    message: 'Donation recorded successfully',
    donor,
  });
});

// ---- Admin-only ----

exports.listPendingVerification = asyncHandler(async (req, res) => {
  const donors = await bloodDonorService.listUnverifiedDonors();

  res.status(200).json({
    message: 'Unverified blood donors fetched successfully',
    count: donors.length,
    donors,
  });
});

exports.verifyDonor = asyncHandler(async (req, res) => {
  const donor = await bloodDonorService.verifyDonor(req.params.id);

  res.status(200).json({
    message: 'Blood donor verified successfully',
    donor,
  });
});

exports.findEmergencyDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, pincode, city } = req.query;

  const donors = await bloodDonorService.findEmergencyDonors({ bloodGroup, pincode, city });

  // Contact details (phone/email) are only safe to hand out to a logged-in
  // user — this endpoint is public (optionalAuth) so anonymous visitors can
  // still see who's available, just not reach them directly. This stops the
  // donor list from being a scrapable directory of phone numbers.
  const isLoggedIn = !!req.user;
  const safeDonors = donors.map((d) => {
    const donor = d.toObject();
    if (!isLoggedIn) {
      donor.user = donor.user
        ? { _id: donor.user._id, fullName: donor.user.fullName }
        : donor.user;
      donor.contactLocked = true;
    }
    return donor;
  });

  res.status(200).json({
    message: 'Donors fetched successfully',
    count: safeDonors.length,
    donors: safeDonors,
  });
});