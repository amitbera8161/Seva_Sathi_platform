const resourceService = require('../services/resource.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.create = asyncHandler(async (req, res) => {
  const resource = await resourceService.createResource(req.user.id, req.body);

  res.status(201).json({
    message: 'Resource shared successfully',
    resource,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const { category, city, pincode, availableOnly, limit } = req.query;

  const resources = await resourceService.listResources({ category, city, pincode, availableOnly, limit });

  res.status(200).json({
    message: 'Resources fetched successfully',
    count: resources.length,
    resources,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);

  res.status(200).json({
    message: 'Resource fetched successfully',
    resource,
  });
});

exports.request = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const resource = await resourceService.requestResource(req.params.id, req.user.id, message);

  res.status(200).json({
    message: 'Request sent to the person who shared this resource',
    resource,
  });
});

exports.respondToRequest = asyncHandler(async (req, res) => {
  const { requesterId, status } = req.body;
  const resource = await resourceService.respondToRequest(req.params.id, requesterId, req.user.id, status);

  res.status(200).json({
    message: `Request ${status}`,
    resource,
  });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const resource = await resourceService.updateAvailability(req.params.id, req.user.id, isAvailable);

  res.status(200).json({
    message: 'Resource updated successfully',
    resource,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  await resourceService.deleteResource(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Resource listing deleted',
  });
});
