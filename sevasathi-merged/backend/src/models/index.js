const { User, ROLES } = require('./user.model');
const { BloodDonor, BLOOD_GROUPS } = require('./blooddonor.model');
const {
  BloodRequest,
  BLOOD_REQUEST_STATUS,
  BLOOD_REQUEST_PRIORITY,
  MATCH_RESPONSE_STATUS,
} = require('./bloodrequest.model');
const { Volunteer, CAUSES, AVAILABILITY_DAYS, TIME_SLOTS } = require('./volunteer.model');
const { NGO, ORG_TYPES, VERIFICATION_STATUS } = require('./ngo.model');
const { BookDonor } = require('./bookdonor.model');
const { Book, BOOK_CONDITIONS, BOOK_CATEGORIES, BOOK_LANGUAGES, BOOK_STATUS } = require('./book.model');
const { BookRequest, BOOK_REQUEST_STATUS } = require('./bookrequest.model');
const { EmergencyRequest, CATEGORIES: EMERGENCY_CATEGORIES, SEVERITY, STATUS: EMERGENCY_STATUS } = require('./emergencyrequest.model');
const { Resource, CATEGORIES: RESOURCE_CATEGORIES } = require('./resource.model');
const { Post, POST_TYPES } = require('./post.model');

module.exports = {
  // Models
  User,
  BloodDonor,
  BloodRequest,
  Volunteer,
  NGO,
  BookDonor,
  Book,
  BookRequest,
  EmergencyRequest,
  Resource,
  Post,

  // Enums (re-exported so controllers/validators can import from one place)
  ROLES,
  BLOOD_GROUPS,
  BLOOD_REQUEST_STATUS,
  BLOOD_REQUEST_PRIORITY,
  MATCH_RESPONSE_STATUS,
  CAUSES,
  AVAILABILITY_DAYS,
  TIME_SLOTS,
  ORG_TYPES,
  VERIFICATION_STATUS,
  BOOK_CONDITIONS,
  BOOK_CATEGORIES,
  BOOK_LANGUAGES,
  BOOK_STATUS,
  BOOK_REQUEST_STATUS,
  EMERGENCY_CATEGORIES,
  SEVERITY,
  EMERGENCY_STATUS,
  RESOURCE_CATEGORIES,
  POST_TYPES,
};
