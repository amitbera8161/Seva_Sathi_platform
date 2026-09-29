const { EmergencyRequest } = require('../models/emergencyrequest.model');
const { ApiError } = require('../utils/apierror');

async function createRequest(userId, payload) {
  const { category, title, description, severity, contactPhone, address, city, pincode } = payload;

  return EmergencyRequest.create({
    postedBy: userId,
    category,
    title,
    description,
    severity: severity || 'moderate',
    contactPhone,
    address,
    city,
    pincode,
  });
}

// Public feed of requests — filterable by status/category/severity/city.
// Defaults to open requests, newest first, so the dashboard's "Active"
// list doesn't have to filter client-side.
async function listRequests({ status, category, severity, city, pincode, limit = 50 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (severity) query.severity = severity;
  if (pincode) query.pincode = pincode;
  else if (city) query.city = city;

  return EmergencyRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .populate('postedBy', 'fullName city')
    .populate('helpers.user', 'fullName');
}

async function getRequestById(requestId) {
  const request = await EmergencyRequest.findById(requestId)
    .populate('postedBy', 'fullName city phone')
    .populate('helpers.user', 'fullName');
  if (!request) throw new ApiError(404, 'Emergency request not found');
  return request;
}

async function offerHelp(requestId, userId) {
  const request = await EmergencyRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Emergency request not found');
  if (request.status === 'resolved') {
    throw new ApiError(409, 'This request has already been resolved');
  }

  request.addHelper(userId);
  await request.save();
  return request;
}

async function withdrawHelp(requestId, userId) {
  const request = await EmergencyRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Emergency request not found');

  request.removeHelper(userId);
  await request.save();
  return request;
}

// Only the person who posted the request can mark it resolved.
async function resolveRequest(requestId, userId) {
  const request = await EmergencyRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Emergency request not found');
  if (request.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the person who posted this request can resolve it');
  }

  request.markResolved(userId);
  await request.save();
  return request;
}

async function deleteRequest(requestId, userId) {
  const request = await EmergencyRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Emergency request not found');
  if (request.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the person who posted this request can delete it');
  }

  await request.deleteOne();
  return { deleted: true };
}

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  offerHelp,
  withdrawHelp,
  resolveRequest,
  deleteRequest,
};
