const { Resource } = require('../models/resource.model');
const { ApiError } = require('../utils/apierror');

async function createResource(userId, payload) {
  const { category, title, description, city, pincode } = payload;

  return Resource.create({
    postedBy: userId,
    category,
    title,
    description,
    city,
    pincode,
  });
}

async function listResources({ category, city, pincode, availableOnly, limit = 50 } = {}) {
  const query = {};
  if (category) query.category = category;
  if (pincode) query.pincode = pincode;
  else if (city) query.city = city;
  if (availableOnly === true || availableOnly === 'true') query.isAvailable = true;

  return Resource.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .populate('postedBy', 'fullName city');
}

async function getResourceById(resourceId) {
  const resource = await Resource.findById(resourceId)
    .populate('postedBy', 'fullName city')
    .populate('requests.user', 'fullName');
  if (!resource) throw new ApiError(404, 'Resource not found');
  return resource;
}

async function requestResource(resourceId, userId, message) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new ApiError(404, 'Resource not found');
  if (!resource.isAvailable) throw new ApiError(409, 'This resource is no longer available');
  if (resource.postedBy.toString() === userId.toString()) {
    throw new ApiError(400, 'You cannot request your own listing');
  }

  resource.requestResource(userId, message);
  await resource.save();
  return resource;
}

// Only the poster can approve/reject a request against their own listing.
async function respondToRequest(resourceId, requesterId, ownerId, status) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new ApiError(404, 'Resource not found');
  if (resource.postedBy.toString() !== ownerId.toString()) {
    throw new ApiError(403, 'Only the person who shared this resource can respond to requests');
  }

  resource.setRequestStatus(requesterId, status);
  if (status === 'approved') resource.isAvailable = false;
  await resource.save();
  return resource;
}

async function updateAvailability(resourceId, userId, isAvailable) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new ApiError(404, 'Resource not found');
  if (resource.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the person who shared this resource can update it');
  }

  resource.isAvailable = !!isAvailable;
  await resource.save();
  return resource;
}

async function deleteResource(resourceId, userId) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new ApiError(404, 'Resource not found');
  if (resource.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the person who shared this resource can delete it');
  }

  await resource.deleteOne();
  return { deleted: true };
}

module.exports = {
  createResource,
  listResources,
  getResourceById,
  requestResource,
  respondToRequest,
  updateAvailability,
  deleteResource,
};
