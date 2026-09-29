const bloodRequestService = require('../services/bloodrequest.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.create = asyncHandler(async (req, res) => {
  const request = await bloodRequestService.createBloodRequest(req.user.id, req.body);

  res.status(201).json({
    message: 'Blood request created successfully',
    request,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const { status, bloodGroup, city, pincode } = req.query;

  const requests = await bloodRequestService.listRequests({ status, bloodGroup, city, pincode });

  res.status(200).json({
    message: 'Blood requests fetched successfully',
    count: requests.length,
    requests,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const request = await bloodRequestService.getRequestById(req.params.id);

  res.status(200).json({
    message: 'Blood request fetched successfully',
    request,
  });
});

exports.listMine = asyncHandler(async (req, res) => {
  const requests = await bloodRequestService.listMyRequests(req.user.id);

  res.status(200).json({
    message: 'Your blood requests fetched successfully',
    count: requests.length,
    requests,
  });
});

exports.listMyDonorMatches = asyncHandler(async (req, res) => {
  const requests = await bloodRequestService.listMyDonorMatches(req.user.id);

  res.status(200).json({
    message: 'Your matched blood requests fetched successfully',
    count: requests.length,
    requests,
  });
});

exports.donorRespond = asyncHandler(async (req, res) => {
  const { response, eta } = req.body;

  const request = await bloodRequestService.respondAsDonor(req.params.id, req.user.id, response, { eta });

  res.status(200).json({
    message: `Response recorded (${response})`,
    request,
  });
});

exports.rematch = asyncHandler(async (req, res) => {
  const isAdmin = !!req.user.roles?.includes('admin');

  const request = await bloodRequestService.rematch(req.params.id, req.user.id, isAdmin);

  res.status(200).json({
    message: 'Rematch triggered',
    request,
  });
});

// Either the patient or an accepted donor calls this once the donation
// actually happened. Symmetric — first call moves the request to
// "waiting_confirmation", the matching call from the other side moves it
// to "completed". No NGO/admin approval required.
exports.confirm = asyncHandler(async (req, res) => {
  const request = await bloodRequestService.confirmDonation(req.params.id, req.user.id);

  res.status(200).json({
    message: request.status === 'completed' ? 'Donation completed' : 'Confirmation recorded — waiting on the other side',
    request,
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  const isAdmin = !!req.user.roles?.includes('admin');
  const { reason } = req.body;

  const request = await bloodRequestService.cancelRequest(req.params.id, req.user.id, isAdmin, reason);

  res.status(200).json({
    message: 'Blood request cancelled',
    request,
  });
});
