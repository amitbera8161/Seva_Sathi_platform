const { NGO } = require('../models/ngo.model');
const { User } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');

async function registerNGO(userId, payload) {
  const {
    orgName, orgType, registrationNumber, description, website,
    contactEmail, contactPhone, address, city, pincode,
  } = payload;

  const existing = await NGO.findOne({
    $or: [{ user: userId }, { registrationNumber }],
  });
  if (existing) {
    throw new ApiError(409, 'NGO already registered for this user or registration number');
  }

  const ngo = await NGO.create({
    user: userId, orgName, orgType, registrationNumber, description,
    website, contactEmail, contactPhone, address, city, pincode,
  });

  await User.findByIdAndUpdate(userId, { $addToSet: { roles: 'ngo' } });

  return ngo;
}

async function getNGOByUser(userId) {
  const ngo = await NGO.findOne({ user: userId });
  if (!ngo) throw new ApiError(404, 'NGO profile not found');
  return ngo;
}

async function getNGOById(ngoId) {
  const ngo = await NGO.findById(ngoId);
  if (!ngo) throw new ApiError(404, 'NGO not found');
  return ngo;
}

async function listNGOs(filters = {}) {
  const query = {};
  if (filters.city) query.city = filters.city;
  if (filters.pincode) query.pincode = filters.pincode;
  if (filters.orgType) query.orgType = filters.orgType;
  if (filters.verifiedOnly) query.verificationStatus = 'verified';

  return NGO.find(query).sort({ createdAt: -1 });
}

async function updateNGO(userId, updates) {
  const ngo = await getNGOByUser(userId);

  const editableFields = [
    'orgName', 'description', 'website', 'contactEmail',
    'contactPhone', 'address', 'city', 'pincode', 'logoUrl',
  ];
  for (const field of editableFields) {
    if (updates[field] !== undefined) ngo[field] = updates[field];
  }

  // Changing registration number resets verification — identity
  // changed, so it needs to be reviewed again before staying "verified".
  if (updates.registrationNumber && updates.registrationNumber !== ngo.registrationNumber) {
    ngo.registrationNumber = updates.registrationNumber;
    ngo.verificationStatus = 'pending';
  }

  await ngo.save();
  return ngo;
}

async function addVerificationDocument(userId, docType, url) {
  const ngo = await getNGOByUser(userId);

  ngo.verificationDocuments.push({ docType, url });
  if (ngo.verificationStatus === 'pending') {
    ngo.verificationStatus = 'under_review';
  }

  await ngo.save();
  return ngo;
}

// ---- Admin workflow ----

async function verifyNGO(ngoId, adminId, notes = '') {
  const ngo = await getNGOById(ngoId);

  ngo.verificationStatus = 'verified';
  ngo.verifiedAt = new Date();
  ngo.verifiedBy = adminId;
  ngo.verificationNotes = notes;
  await ngo.save();

  // await emailService.sendNGOVerifiedEmail(ngo);
  return ngo;
}

async function rejectNGO(ngoId, adminId, notes = '') {
  const ngo = await getNGOById(ngoId);

  ngo.verificationStatus = 'rejected';
  ngo.verifiedAt = null;
  ngo.verifiedBy = adminId;
  ngo.verificationNotes = notes;
  await ngo.save();

  // await emailService.sendNGORejectedEmail(ngo);
  return ngo;
}

async function listPendingNGOs() {
  return NGO.find({ verificationStatus: { $in: ['pending', 'under_review'] } }).sort({ createdAt: 1 });
}

module.exports = {
  registerNGO,
  getNGOByUser,
  getNGOById,
  listNGOs,
  updateNGO,
  addVerificationDocument,
  verifyNGO,
  rejectNGO,
  listPendingNGOs,
};