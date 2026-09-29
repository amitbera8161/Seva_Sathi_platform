const bookDonorService = require('../services/bookdonor.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.register = asyncHandler(async (req, res) => {
  const donor = await bookDonorService.registerBookDonor(req.user.id, req.body);

  res.status(201).json({
    message: 'Book donor profile created successfully',
    donor,
  });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const donor = await bookDonorService.getMyDonorProfile(req.user.id);

  res.status(200).json({
    message: 'Book donor profile fetched successfully',
    donor,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const donor = await bookDonorService.updateDonorProfile(req.user.id, req.body);

  res.status(200).json({
    message: 'Book donor profile updated successfully',
    donor,
  });
});
