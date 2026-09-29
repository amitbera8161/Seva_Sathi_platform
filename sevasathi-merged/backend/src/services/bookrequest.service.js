const { Book } = require('../models/book.model');
const { BookRequest } = require('../models/bookrequest.model');
const { ApiError } = require('../utils/apierror');

function pushHistory(request, status, userId, note = '') {
  request.statusHistory.push({ status, changedBy: userId, note });
}

function assertParty(request, userId) {
  const isParty = [request.beneficiary.toString(), request.donor.toString()].includes(userId.toString());
  if (!isParty) throw new ApiError(403, 'You are not part of this book request');
}

// Releases `qty` reserved copies back to a listing (rejected/cancelled
// path) so someone else can request them, and flips the listing back to
// 'available' if it had been fully claimed.
async function releaseReservation(bookId, qty) {
  const book = await Book.findByIdAndUpdate(bookId, { $inc: { availableQuantity: qty } }, { new: true });
  if (book && book.isActive && book.availableQuantity > 0 && book.status !== 'available') {
    book.status = 'available';
    await book.save();
  }
  return book;
}

// Reserves `qty` copies of `bookId` for `beneficiaryId` and opens a
// BookRequest. The single findOneAndUpdate below — guarded on
// availableQuantity >= qty — is what prevents two beneficiaries from
// both claiming the same physical copy: MongoDB only lets one concurrent
// update satisfy that condition, everyone else gets a 409.
async function requestBook(bookId, beneficiaryId, { quantity = 1, message = '' } = {}) {
  const qty = Math.max(1, Number(quantity) || 1);

  const book = await Book.findById(bookId);
  if (!book) throw new ApiError(404, 'Book not found');
  if (book.donor.toString() === beneficiaryId.toString()) {
    throw new ApiError(400, 'You cannot request your own book listing');
  }

  const existingActive = await BookRequest.findOne({
    book: bookId,
    beneficiary: beneficiaryId,
    status: { $in: ['requested', 'approved'] },
  });
  if (existingActive) {
    throw new ApiError(409, 'You already have an active request for this book');
  }

  const reserved = await Book.findOneAndUpdate(
    { _id: bookId, isActive: true, availableQuantity: { $gte: qty } },
    { $inc: { availableQuantity: -qty }, $set: { status: 'available' } },
    { new: true }
  );
  if (!reserved) {
    throw new ApiError(409, 'This book is no longer available in the quantity requested');
  }
  // findOneAndUpdate bypasses the model's pre('save') status hook, so flip
  // it explicitly when this reservation used up the last copy.
  if (reserved.availableQuantity === 0 && reserved.status !== 'unavailable') {
    reserved.status = 'unavailable';
    await reserved.save();
  }

  const request = new BookRequest({
    book: bookId,
    donor: reserved.donor,
    beneficiary: beneficiaryId,
    quantityRequested: qty,
    message,
    status: 'requested',
  });
  pushHistory(request, 'requested', beneficiaryId, message);
  await request.save();

  await Book.findByIdAndUpdate(bookId, { $inc: { totalRequests: 1 } });

  return request;
}

async function approveRequest(requestId, donorId, note = '') {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  if (request.donor.toString() !== donorId.toString()) {
    throw new ApiError(403, 'Only the donor of this book can approve requests');
  }
  if (request.status !== 'requested') {
    throw new ApiError(409, `Request cannot be approved from status "${request.status}"`);
  }

  request.status = 'approved';
  request.approvedAt = new Date();
  if (note) request.donorNote = note;
  pushHistory(request, 'approved', donorId, note);
  await request.save();

  return request;
}

async function rejectRequest(requestId, donorId, note = '') {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  if (request.donor.toString() !== donorId.toString()) {
    throw new ApiError(403, 'Only the donor of this book can reject requests');
  }
  if (request.status !== 'requested') {
    throw new ApiError(409, `Request cannot be rejected from status "${request.status}"`);
  }

  request.status = 'rejected';
  request.rejectedAt = new Date();
  if (note) request.donorNote = note;
  pushHistory(request, 'rejected', donorId, note);
  await request.save();

  await releaseReservation(request.book, request.quantityRequested);
  return request;
}

// Either the beneficiary or the donor can cancel while it's still
// requested/approved — mirrors BloodRequest's cancel semantics.
async function cancelRequest(requestId, userId, reason = '') {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  assertParty(request, userId);
  if (!['requested', 'approved'].includes(request.status)) {
    throw new ApiError(409, `Request cannot be cancelled from status "${request.status}"`);
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  request.cancelledBy = userId;
  request.cancelReason = reason;
  pushHistory(request, 'cancelled', userId, reason);
  await request.save();

  await releaseReservation(request.book, request.quantityRequested);
  return request;
}

// Admin-only moderation power (mirrors BloodRequest's admin cancel) — can
// step in on any non-terminal request, not just ones they're a party to.
async function adminCancelRequest(requestId, adminId, reason = '') {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  if (!['requested', 'approved', 'collected'].includes(request.status)) {
    throw new ApiError(409, `Request cannot be cancelled from status "${request.status}"`);
  }

  const wasReserved = ['requested', 'approved'].includes(request.status);
  const finalReason = reason || 'Cancelled by admin';

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  request.cancelledBy = adminId;
  request.cancelReason = finalReason;
  pushHistory(request, 'cancelled', adminId, finalReason);
  await request.save();

  if (wasReserved) await releaseReservation(request.book, request.quantityRequested);
  return request;
}

// Either side confirms handover happened.
async function markCollected(requestId, userId) {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  assertParty(request, userId);
  if (request.status !== 'approved') {
    throw new ApiError(409, `Request cannot be marked collected from status "${request.status}"`);
  }

  request.status = 'collected';
  request.collectedAt = new Date();
  pushHistory(request, 'collected', userId);
  await request.save();

  return request;
}

// Either side closes the loop once the exchange is fully done.
async function markCompleted(requestId, userId) {
  const request = await BookRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Book request not found');
  assertParty(request, userId);
  if (request.status !== 'collected') {
    throw new ApiError(409, `Request cannot be completed from status "${request.status}"`);
  }

  request.status = 'completed';
  request.completedAt = new Date();
  pushHistory(request, 'completed', userId);
  await request.save();

  await Book.findByIdAndUpdate(request.book, { $inc: { totalCompleted: 1 } });
  return request;
}

async function myRequestsAsBeneficiary(userId) {
  return BookRequest.find({ beneficiary: userId })
    .sort({ createdAt: -1 })
    .populate('book')
    .populate('donor', 'fullName phone city');
}

async function myRequestsAsDonor(userId) {
  return BookRequest.find({ donor: userId })
    .sort({ createdAt: -1 })
    .populate('book')
    .populate('beneficiary', 'fullName phone city');
}

// Platform-wide oversight for Volunteer/NGO/Admin coordination.
async function listAllRequests({ status } = {}) {
  const query = {};
  if (status) query.status = status;

  return BookRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('book')
    .populate('donor', 'fullName city')
    .populate('beneficiary', 'fullName city');
}

module.exports = {
  requestBook,
  approveRequest,
  rejectRequest,
  cancelRequest,
  adminCancelRequest,
  markCollected,
  markCompleted,
  myRequestsAsBeneficiary,
  myRequestsAsDonor,
  listAllRequests,
};
