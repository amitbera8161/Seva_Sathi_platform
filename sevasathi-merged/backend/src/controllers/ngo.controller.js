const ngoService = require('../services/ngo.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.register = asyncHandler(async (req, res) => {
  const ngo = await ngoService.registerNGO(req.user.id, req.body);

  res.status(201).json({
    message: 'NGO registered successfully. Verification pending.',
    ngo,
  });
});

exports.getMyNGO = asyncHandler(async (req, res) => {
  const ngo = await ngoService.getNGOByUser(req.user.id);

  res.status(200).json({
    message: 'NGO fetched successfully',
    ngo,
  });
});

exports.getNGOById = asyncHandler(async (req, res) => {
  const ngo = await ngoService.getNGOById(req.params.id);

  res.status(200).json({
    message: 'NGO fetched successfully',
    ngo,
  });
});

exports.listNGOs = asyncHandler(async (req, res) => {
  const { city, pincode, orgType, verified } = req.query;

  const ngos = await ngoService.listNGOs({
    city, pincode, orgType, verifiedOnly: verified === 'true',
  });

  res.status(200).json({
    message: 'NGOs fetched successfully',
    count: ngos.length,
    ngos,
  });
});

exports.updateNGO = asyncHandler(async (req, res) => {
  const ngo = await ngoService.updateNGO(req.user.id, req.body);

  res.status(200).json({
    message: 'NGO updated successfully',
    ngo,
  });
});

exports.uploadVerificationDocument = asyncHandler(async (req, res) => {
  const { docType, url } = req.body;

  const ngo = await ngoService.addVerificationDocument(req.user.id, docType, url);

  res.status(200).json({
    message: 'Document uploaded successfully',
    ngo,
  });
});

// ---- Admin-only routes (protect with isAdmin middleware) ----

exports.verifyNGO = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const ngo = await ngoService.verifyNGO(req.params.id, req.user.id, notes);

  res.status(200).json({
    message: 'NGO verified successfully',
    ngo,
  });
});

exports.rejectNGO = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const ngo = await ngoService.rejectNGO(req.params.id, req.user.id, notes);

  res.status(200).json({
    message: 'NGO rejected',
    ngo,
  });
});

exports.listPendingNGOs = asyncHandler(async (req, res) => {
  const ngos = await ngoService.listPendingNGOs();

  res.status(200).json({
    message: 'Pending NGOs fetched successfully',
    count: ngos.length,
    ngos,
  });
});