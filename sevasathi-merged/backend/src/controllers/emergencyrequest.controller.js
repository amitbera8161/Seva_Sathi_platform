const emergencyRequestService = require('../services/emergencyrequest.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.create = asyncHandler(async (req, res) => {
  const request = await emergencyRequestService.createRequest(req.user.id, req.body);

  res.status(201).json({
    message: 'Emergency request posted successfully',
    request,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const { status, category, severity, city, pincode, limit } = req.query;

  const requests = await emergencyRequestService.listRequests({
    status,
    category,
    severity,
    city,
    pincode,
    limit,
  });

  res.status(200).json({
    message: 'Emergency requests fetched successfully',
    count: requests.length,
    requests,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const request = await emergencyRequestService.getRequestById(req.params.id);

  res.status(200).json({
    message: 'Emergency request fetched successfully',
    request,
  });
});

exports.offerHelp = asyncHandler(async (req, res) => {
  const request = await emergencyRequestService.offerHelp(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Thanks for offering to help!',
    request,
  });
});

exports.withdrawHelp = asyncHandler(async (req, res) => {
  const request = await emergencyRequestService.withdrawHelp(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Withdrawn from this request',
    request,
  });
});

exports.resolve = asyncHandler(async (req, res) => {
  const request = await emergencyRequestService.resolveRequest(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Request marked as resolved',
    request,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  await emergencyRequestService.deleteRequest(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Emergency request deleted',
  });
});
