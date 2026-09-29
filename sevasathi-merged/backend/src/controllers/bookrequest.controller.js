const bookRequestService = require('../services/bookrequest.service');
const { asyncHandler } = require('../utils/asynchandler');

// Mounted as POST /books/:id/request — bookId comes from the parent
// resource's route, mirroring resource.routes.js's POST /resources/:id/request.
exports.create = asyncHandler(async (req, res) => {
  const { quantity, message } = req.body;
  const request = await bookRequestService.requestBook(req.params.id, req.user.id, { quantity, message });

  res.status(201).json({
    message: 'Book request sent to the donor',
    request,
  });
});

exports.listAll = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const requests = await bookRequestService.listAllRequests({ status });

  res.status(200).json({
    message: 'Book requests fetched successfully',
    count: requests.length,
    requests,
  });
});

// Beneficiary: requests I made
exports.myRequests = asyncHandler(async (req, res) => {
  const requests = await bookRequestService.myRequestsAsBeneficiary(req.user.id);

  res.status(200).json({
    message: 'Your book requests fetched successfully',
    count: requests.length,
    requests,
  });
});

// Donor: requests on books I've listed
exports.incomingRequests = asyncHandler(async (req, res) => {
  const requests = await bookRequestService.myRequestsAsDonor(req.user.id);

  res.status(200).json({
    message: 'Requests on your book listings fetched successfully',
    count: requests.length,
    requests,
  });
});

exports.approve = asyncHandler(async (req, res) => {
  const request = await bookRequestService.approveRequest(req.params.id, req.user.id, req.body.note);

  res.status(200).json({
    message: 'Request approved',
    request,
  });
});

exports.reject = asyncHandler(async (req, res) => {
  const request = await bookRequestService.rejectRequest(req.params.id, req.user.id, req.body.note);

  res.status(200).json({
    message: 'Request rejected',
    request,
  });
});

exports.collect = asyncHandler(async (req, res) => {
  const request = await bookRequestService.markCollected(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Marked as collected',
    request,
  });
});

exports.complete = asyncHandler(async (req, res) => {
  const request = await bookRequestService.markCompleted(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Book exchange completed',
    request,
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  const isAdmin = req.user.roles?.includes('admin');
  const request = isAdmin
    ? await bookRequestService.adminCancelRequest(req.params.id, req.user.id, req.body.reason)
    : await bookRequestService.cancelRequest(req.params.id, req.user.id, req.body.reason);

  res.status(200).json({
    message: 'Request cancelled',
    request,
  });
});
