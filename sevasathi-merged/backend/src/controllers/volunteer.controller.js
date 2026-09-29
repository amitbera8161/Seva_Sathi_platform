const volunteerService = require('../services/volunteer.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.register = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.registerVolunteer(req.user.id, req.body);

  res.status(201).json({
    message: 'Volunteer profile created successfully',
    volunteer,
  });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.getMyVolunteerProfile(req.user.id);

  res.status(200).json({
    message: 'Volunteer profile fetched successfully',
    volunteer,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const volunteer = await volunteerService.updateVolunteerProfile(req.user.id, req.body);

  res.status(200).json({
    message: 'Volunteer profile updated successfully',
    volunteer,
  });
});

exports.applyToEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const volunteer = await volunteerService.applyToEvent(req.user.id, eventId);

  res.status(200).json({
    message: 'Applied to event successfully',
    volunteer,
  });
});

exports.markEventAttended = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { hoursContributed } = req.body;

  const volunteer = await volunteerService.markEventAttended(req.user.id, eventId, hoursContributed);

  res.status(200).json({
    message: 'Event marked as attended',
    volunteer,
  });
});

exports.findVolunteers = asyncHandler(async (req, res) => {
  const { cause, skill, pincode, city } = req.query;

  const volunteers = await volunteerService.findVolunteers({ cause, skill, pincode, city });

  res.status(200).json({
    message: 'Volunteers fetched successfully',
    count: volunteers.length,
    volunteers,
  });
});