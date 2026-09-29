const { Volunteer } = require('../models/volunteer.model');
const { User } = require('../models/user.model');
const { ApiError } = require('../utils/apierror');

async function registerVolunteer(userId, payload) {
  const existing = await Volunteer.findOne({ user: userId });
  if (existing) {
    throw new ApiError(409, 'Volunteer profile already exists for this user');
  }

  const {
    skills,
    causes,
    availableDays,
    preferredTimeSlot,
    maxTravelDistanceKm,
    bio,
    city,
    pincode,
  } = payload;

  const volunteer = await Volunteer.create({
    user: userId,
    skills,
    causes,
    availableDays,
    preferredTimeSlot,
    maxTravelDistanceKm,
    bio,
    city,
    pincode,
  });

  await User.findByIdAndUpdate(userId, { $addToSet: { roles: 'volunteer' } });

  return volunteer;
}

async function getMyVolunteerProfile(userId) {
  const volunteer = await Volunteer.findOne({ user: userId }).populate('events.event');
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');
  return volunteer;
}

async function updateVolunteerProfile(userId, updates) {
  const volunteer = await Volunteer.findOne({ user: userId });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');

  const editableFields = [
    'skills', 'causes', 'availableDays', 'preferredTimeSlot',
    'maxTravelDistanceKm', 'bio', 'city', 'pincode',
  ];

  for (const field of editableFields) {
    if (updates[field] !== undefined) volunteer[field] = updates[field];
  }

  await volunteer.save();
  return volunteer;
}

// Cross-model orchestration (Volunteer + Event) — this is exactly why
// it belongs in a service rather than as a method on either model.
async function applyToEvent(userId, eventId) {
  const volunteer = await Volunteer.findOne({ user: userId });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');

  const alreadyApplied = volunteer.events.some(
    (e) => e.event.toString() === eventId.toString()
  );
  if (alreadyApplied) {
    throw new ApiError(409, 'Already applied to this event');
  }

  volunteer.events.push({ event: eventId, status: 'applied' });
  await volunteer.save();

  // Event model isn't built yet — this is where you'd also push
  // the volunteer into Event.applicants and notify the organizing NGO.
  // await eventService.addApplicant(eventId, volunteer._id);

  return volunteer;
}

async function markEventAttended(userId, eventId, hoursContributed = 0) {
  const volunteer = await Volunteer.findOne({ user: userId });
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');

  const entry = volunteer.events.find((e) => e.event.toString() === eventId.toString());
  if (!entry) throw new ApiError(404, 'No application found for this event');

  entry.status = 'attended';
  volunteer.totalEventsAttended += 1;
  volunteer.totalHoursContributed += hoursContributed;

  await volunteer.save();
  return volunteer;
}

// Find volunteers matching a cause + location — used by NGOs/organizers
// looking for people to invite to an event.
async function findVolunteers({ cause, skill, pincode, city }) {
  const query = { isActive: true };

  if (cause) query.causes = cause;
  if (skill) query.skills = skill.toLowerCase();
  if (pincode) query.pincode = pincode;
  else if (city) query.city = city;

  return Volunteer.find(query).populate('user', 'fullName phone email');
}

module.exports = {
  registerVolunteer,
  getMyVolunteerProfile,
  updateVolunteerProfile,
  applyToEvent,
  markEventAttended,
  findVolunteers,
};