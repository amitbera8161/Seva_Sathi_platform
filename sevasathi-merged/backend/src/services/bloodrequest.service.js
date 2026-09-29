const { BloodRequest } = require('../models/bloodrequest.model');
const { BloodDonor } = require('../models/blooddonor.model');
const bloodDonorService = require('./blooddonor.service');
const { ApiError } = require('../utils/apierror');
const { getCompatibleDonorGroups } = require('../utils/bloodCompatibility');
const { cityMatch } = require('../utils/textMatch');

const MAX_MATCHES = 10;
const MATCH_RADIUS_METERS = 25000; // 25km

// No cron/job scheduler exists in this stack, so expiry is evaluated
// lazily whenever a request is read (see applyLazyExpiry below) rather
// than on a timer. A request only expires if NOBODY has accepted yet —
// once a donor commits, the request is a live human commitment, not
// something that silently times out.
const EXPIRY_HOURS = { critical: 6, urgent: 24, normal: 72 };

// Higher priority sorts first wherever donor/oversight lists are shown —
// "sort donor notifications so Critical requests are handled first".
const PRIORITY_RANK = { critical: 0, urgent: 1, normal: 2 };

function byPriorityThenRecency(a, b) {
  const rankDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
  if (rankDiff !== 0) return rankDiff;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

// ---------------------------------------------------------------------
// Lazy expiry
// ---------------------------------------------------------------------

function isStale(request) {
  if (!['pending', 'matched'].includes(request.status)) return false;
  const hours = EXPIRY_HOURS[request.priority] ?? EXPIRY_HOURS.normal;
  const ageMs = Date.now() - new Date(request.createdAt).getTime();
  return ageMs > hours * 60 * 60 * 1000;
}

async function applyLazyExpiry(request) {
  if (!isStale(request)) return request;

  request.status = 'expired';
  request.expiredAt = new Date();
  request.statusHistory.push({
    status: 'expired',
    changedAt: new Date(),
    note: `No donor accepted within the ${EXPIRY_HOURS[request.priority] ?? EXPIRY_HOURS.normal}h window for priority "${request.priority}"`,
  });
  await request.save();
  return request;
}

async function applyLazyExpiryToList(requests) {
  const results = [];
  for (const request of requests) {
    results.push(await applyLazyExpiry(request));
  }
  return results;
}

// ---------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------

// Runs the existing distance -> pincode -> city cascade for a given set of
// blood groups. This is the exact same lookup logic as before — just
// parameterized on `groups` instead of hardcoding request.bloodGroup, so
// both the exact-tier and compatible-tier searches share one code path.
async function searchDonorsByGroups(groups, request) {
  const baseQuery = {
    bloodGroup: { $in: groups },
    availableForEmergency: true,
    isActive: true,
    $or: [{ nextEligibleDate: null }, { nextEligibleDate: { $lte: new Date() } }],
  };

  if (request.location?.coordinates?.length === 2) {
    return BloodDonor.find({
      ...baseQuery,
      location: {
        $near: {
          $geometry: request.location,
          $maxDistance: MATCH_RADIUS_METERS,
        },
      },
    })
      .limit(MAX_MATCHES)
      .populate('user', 'fullName phone email');
  }

  if (request.pincode) {
    const byPincode = await BloodDonor.find({ ...baseQuery, pincode: request.pincode })
      .limit(MAX_MATCHES)
      .populate('user', 'fullName phone email');

    if (byPincode.length > 0 || !request.city) return byPincode;

    return BloodDonor.find({ ...baseQuery, city: cityMatch(request.city) })
      .limit(MAX_MATCHES)
      .populate('user', 'fullName phone email');
  }

  if (request.city) {
    return BloodDonor.find({ ...baseQuery, city: cityMatch(request.city) })
      .limit(MAX_MATCHES)
      .populate('user', 'fullName phone email');
  }

  return [];
}

function excludeIneligible(donors, request, alreadyPickedUserIds) {
  const declinedUserIds = new Set(
    request.matchedDonors.filter((m) => m.status === 'rejected').map((m) => m.user.toString())
  );
  const acceptedUserIds = new Set(request.acceptedDonors.map((a) => a.user.toString()));

  return donors.filter(
    (d) =>
      d.user &&
      d.user._id.toString() !== request.patient.toString() &&
      !declinedUserIds.has(d.user._id.toString()) &&
      !acceptedUserIds.has(d.user._id.toString()) &&
      !alreadyPickedUserIds.has(d.user._id.toString())
  );
}

// Two-tier search:
//   Tier 1 (exact)      — donor's blood group == request.bloodGroup
//   Tier 2 (compatible) — only runs if tier 1 didn't find enough donors to
//                          cover the still-outstanding units, per standard
//                          transfusion compatibility (see bloodCompatibility.js)
// Each tier reuses the identical distance -> pincode -> city cascade above,
// so ordering within a tier is unchanged from before this enhancement.
// Returns [{ donor, tier }], exact-tier entries first, capped at MAX_MATCHES
// total so tier 1 is never crowded out by tier 2 once concatenated.
async function findMatchingDonors(request) {
  const remainingNeed = Math.max(request.unitsRequired - request.acceptedDonors.length, 1);

  const exactRaw = await searchDonorsByGroups([request.bloodGroup], request);
  const exactPicked = new Set();
  const exactDonors = excludeIneligible(exactRaw, request, exactPicked);
  exactDonors.forEach((d) => exactPicked.add(d.user._id.toString()));

  let matches = exactDonors.map((donor) => ({ donor, tier: 'exact' }));

  if (matches.length < remainingNeed) {
    const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);
    if (compatibleGroups.length > 0) {
      const compatRaw = await searchDonorsByGroups(compatibleGroups, request);
      const compatDonors = excludeIneligible(compatRaw, request, exactPicked);
      matches = matches.concat(compatDonors.map((donor) => ({ donor, tier: 'compatible' })));
    }
  }

  return matches.slice(0, MAX_MATCHES);
}

// Runs matching against a request document (already loaded/saved) and
// persists any newly-found donors. Idempotent — safe to call multiple
// times (on create, and again via the manual /rematch endpoint).
async function runMatching(request) {
  const found = await findMatchingDonors(request);

  const alreadyMatchedIds = new Set(request.matchedDonors.map((m) => m.user.toString()));
  const newMatches = found.filter(({ donor }) => !alreadyMatchedIds.has(donor.user._id.toString()));

  for (const { donor, tier } of newMatches) {
    request.matchedDonors.push({
      donor: donor._id,
      user: donor.user._id,
      status: 'pending',
      matchedAt: new Date(),
      matchTier: tier,
    });
  }

  const hasPendingMatch = request.matchedDonors.some((m) => m.status === 'pending');
  if (hasPendingMatch && request.status === 'pending') {
    request.status = 'matched';
    const exactCount = newMatches.filter((m) => m.tier === 'exact').length;
    const compatCount = newMatches.filter((m) => m.tier === 'compatible').length;
    request.statusHistory.push({
      status: 'matched',
      changedAt: new Date(),
      note:
        `${newMatches.length} donor(s) matched` +
        (compatCount > 0 ? ` (${exactCount} exact, ${compatCount} compatible-group)` : ''),
    });
  }

  await request.save();
  return request;
}

// ---------------------------------------------------------------------
// Create / read
// ---------------------------------------------------------------------

async function createBloodRequest(userId, payload) {
  const {
    bloodGroup,
    unitsRequired,
    priority,
    hospitalName,
    hospitalAddress,
    city,
    pincode,
    contactPhone,
    notes,
  } = payload;

  if (!bloodGroup) throw new ApiError(400, 'Blood group is required');
  if (!hospitalName) throw new ApiError(400, 'Hospital name is required');

  const request = await BloodRequest.create({
    patient: userId,
    bloodGroup,
    unitsRequired: unitsRequired || 1,
    priority: priority || 'urgent',
    hospitalName,
    hospitalAddress,
    city,
    pincode,
    contactPhone,
    notes,
  });

  request.statusHistory.push({ status: 'pending', changedAt: new Date(), changedBy: userId });
  await request.save();

  await runMatching(request);

  return request;
}

async function getRequestById(id) {
  const request = await BloodRequest.findById(id)
    .populate('patient', 'fullName phone city')
    .populate('acceptedDonors.user', 'fullName phone')
    .populate('matchedDonors.user', 'fullName phone');

  if (!request) throw new ApiError(404, 'Blood request not found');
  return applyLazyExpiry(request);
}

async function listRequests(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;
  if (filters.city) query.city = cityMatch(filters.city);
  if (filters.pincode) query.pincode = filters.pincode;

  const requests = await BloodRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('patient', 'fullName phone city')
    .populate('acceptedDonors.user', 'fullName phone');

  const expired = await applyLazyExpiryToList(requests);
  return expired.sort(byPriorityThenRecency);
}

async function listMyRequests(userId) {
  const requests = await BloodRequest.find({ patient: userId })
    .sort({ createdAt: -1 })
    .populate('acceptedDonors.user', 'fullName phone');
  return applyLazyExpiryToList(requests);
}

async function listMyDonorMatches(userId) {
  const requests = await BloodRequest.find({
    $or: [{ 'matchedDonors.user': userId }, { 'acceptedDonors.user': userId }],
  })
    .sort({ createdAt: -1 })
    .populate('patient', 'fullName phone city')
    .populate('acceptedDonors.user', 'fullName phone');

  const expired = await applyLazyExpiryToList(requests);
  return expired.sort(byPriorityThenRecency);
}

// ---------------------------------------------------------------------
// Lifecycle transitions
// ---------------------------------------------------------------------

// Moves status forward once the "how many donors do we actually have"
// picture changes — call after any accept.
function recomputeStaffingStatus(request) {
  if (request.acceptedDonors.length === 0) return;

  if (request.acceptedDonors.length >= request.unitsRequired) {
    if (request.status !== 'in_progress') {
      request.status = 'in_progress';
      request.statusHistory.push({
        status: 'in_progress',
        changedAt: new Date(),
        note: 'All required units have an accepted donor',
      });
      // No point leaving other donors' invitations open — they'd be
      // traveling for nothing.
      request.matchedDonors.forEach((m) => {
        if (m.status === 'pending') m.status = 'expired';
      });
    }
  } else if (request.status !== 'accepted') {
    request.status = 'accepted';
    request.statusHistory.push({
      status: 'accepted',
      changedAt: new Date(),
      note: `${request.acceptedDonors.length}/${request.unitsRequired} units covered — still recruiting`,
    });
  }
}

async function respondAsDonor(requestId, donorUserId, response, { eta } = {}) {
  if (!['accept', 'reject'].includes(response)) {
    throw new ApiError(400, 'response must be "accept" or "reject"');
  }

  const request = await BloodRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Blood request not found');

  if (!['pending', 'matched', 'accepted'].includes(request.status)) {
    throw new ApiError(409, `Cannot respond — request is already ${request.status}`);
  }

  const entry = request.matchedDonors.find(
    (m) => m.user.toString() === donorUserId.toString() && m.status === 'pending'
  );
  if (!entry) throw new ApiError(403, 'You are not a pending matched donor for this request');

  entry.respondedAt = new Date();

  if (response === 'reject') {
    entry.status = 'rejected';

    const stillHasPending = request.matchedDonors.some((m) => m.status === 'pending');
    if (!stillHasPending && request.acceptedDonors.length === 0) {
      request.status = 'pending'; // no active matches left — needs a rematch
      request.statusHistory.push({
        status: 'pending',
        changedAt: new Date(),
        note: 'All matched donors declined — awaiting rematch',
      });
    }
  } else {
    if (request.acceptedDonors.length >= request.unitsRequired) {
      throw new ApiError(409, 'This request already has enough accepted donors');
    }

    const donorProfile = await BloodDonor.findOne({ user: donorUserId });
    if (!donorProfile) throw new ApiError(404, 'Blood donor profile not found');

    entry.status = 'accepted';
    request.acceptedDonors.push({
      donor: donorProfile._id,
      user: donorUserId,
      eta: eta || '',
      acceptedAt: new Date(),
    });

    request.statusHistory.push({
      status: 'accepted',
      changedAt: new Date(),
      changedBy: donorUserId,
      note: eta ? `Donor accepted, ETA ${eta}` : 'Donor accepted',
    });

    recomputeStaffingStatus(request);
  }

  await request.save();
  return request;
}

async function rematch(requestId, actorUserId, isAdmin) {
  const request = await BloodRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Blood request not found');

  if (!['pending', 'matched', 'accepted'].includes(request.status)) {
    throw new ApiError(409, `Cannot rematch — request is ${request.status}`);
  }
  if (request.acceptedDonors.length >= request.unitsRequired) {
    throw new ApiError(409, 'Request is already fully staffed');
  }

  const isPatient = request.patient.toString() === actorUserId.toString();
  if (!isPatient && !isAdmin) {
    throw new ApiError(403, 'Not authorized to rematch this request');
  }

  await runMatching(request);
  return request;
}

// Either the patient or an accepted donor calls this once the donation
// has actually happened. First confirmation -> waiting_confirmation.
// Once the patient AND every accepted donor have confirmed -> completed.
async function confirmDonation(requestId, actorUserId) {
  const request = await BloodRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Blood request not found');

  if (!['in_progress', 'waiting_confirmation'].includes(request.status)) {
    throw new ApiError(409, `Cannot confirm — request must be in progress first (currently ${request.status})`);
  }

  const isPatient = request.patient.toString() === actorUserId.toString();
  const donorEntry = request.acceptedDonors.find((d) => d.user.toString() === actorUserId.toString());

  if (!isPatient && !donorEntry) {
    throw new ApiError(403, 'Only the patient or an accepted donor can confirm this donation');
  }

  if (isPatient) {
    request.patientConfirmedAt = request.patientConfirmedAt || new Date();
  }
  if (donorEntry) {
    donorEntry.donorConfirmedAt = donorEntry.donorConfirmedAt || new Date();
  }

  const allDonorsConfirmed = request.acceptedDonors.every((d) => !!d.donorConfirmedAt);
  const isFullyConfirmed = !!request.patientConfirmedAt && allDonorsConfirmed;

  if (isFullyConfirmed) {
    request.status = 'completed';
    request.completedAt = new Date();
    request.statusHistory.push({ status: 'completed', changedAt: new Date(), changedBy: actorUserId });

    // Reuse the existing donor-donation bookkeeping instead of
    // duplicating eligibility/streak logic here — once per donor.
    for (const donor of request.acceptedDonors) {
      try {
        await bloodDonorService.recordDonation(donor.user);
      } catch (err) {
        // Donor profile might be missing/edited since matching — don't
        // let that block the request itself from completing.
      }
    }
  } else if (request.status !== 'waiting_confirmation') {
    request.status = 'waiting_confirmation';
    request.statusHistory.push({
      status: 'waiting_confirmation',
      changedAt: new Date(),
      changedBy: actorUserId,
      note: isPatient ? 'Patient confirmed, awaiting donor(s)' : 'Donor confirmed, awaiting patient',
    });
  }

  await request.save();
  return request;
}

async function cancelRequest(requestId, actorUserId, isAdmin, reason) {
  const request = await BloodRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Blood request not found');

  if (['completed', 'cancelled', 'expired'].includes(request.status)) {
    throw new ApiError(409, `Cannot cancel — request is already ${request.status}`);
  }

  const isPatient = request.patient.toString() === actorUserId.toString();
  if (!isPatient && !isAdmin) {
    throw new ApiError(403, 'Only the requesting patient or an admin can cancel this request');
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  request.cancelledBy = actorUserId;
  request.cancelReason = reason || '';
  request.statusHistory.push({ status: 'cancelled', changedAt: new Date(), changedBy: actorUserId });
  await request.save();
  return request;
}

module.exports = {
  createBloodRequest,
  getRequestById,
  listRequests,
  listMyRequests,
  listMyDonorMatches,
  respondAsDonor,
  rematch,
  confirmDonation,
  cancelRequest,
};
