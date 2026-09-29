// Analytics is a read-only aggregation layer over existing collections —
// deliberately has no model of its own. Every number here is computed
// live from real data instead of being tracked/duplicated in a separate
// "stats" document that could drift out of sync.

const { BloodDonor } = require('../models/blooddonor.model');
const { EmergencyRequest } = require('../models/emergencyrequest.model');
const { Resource } = require('../models/resource.model');
const { Post } = require('../models/post.model');
const { Volunteer } = require('../models/volunteer.model');
const { NGO } = require('../models/ngo.model');

async function getOverviewStats() {
  const [totalDonors, totalRequests, resolvedRequests, totalVolunteers, totalNGOs, hoursAgg] =
    await Promise.all([
      BloodDonor.countDocuments({ isActive: true }),
      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: 'resolved' }),
      Volunteer.countDocuments({ isActive: true }),
      NGO.countDocuments({ isActive: true }),
      Volunteer.aggregate([{ $group: { _id: null, hours: { $sum: '$totalHoursContributed' } } }]),
    ]);

  const resolutionRate = totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 0;

  return {
    totalDonors,
    helpRequestsFulfilled: resolvedRequests,
    totalRequests,
    totalVolunteers,
    totalNGOs,
    volunteerHours: hoursAgg[0]?.hours || 0,
    resolutionRate, // percentage, e.g. 92 for "92%"
  };
}

// Available donors grouped by blood group — used for the "Blood Demand by
// Group" chart. This reflects donor *supply*, since we don't yet track
// blood-group-specific demand as structured data (it's free text inside
// emergency request descriptions today).
async function getDonorsByBloodGroup() {
  const rows = await BloodDonor.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ bloodGroup: r._id, count: r.count }));
}

// Combined activity (emergency requests + resources + posts) grouped by
// city — used for "City-wise Activity".
async function getCityWiseActivity(limit = 8) {
  const [reqRows, resRows, postRows] = await Promise.all([
    EmergencyRequest.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }]),
    Resource.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }]),
    Post.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }]),
  ]);

  const totals = new Map();
  for (const rows of [reqRows, resRows, postRows]) {
    for (const row of rows) {
      const city = row._id || 'Unspecified';
      totals.set(city, (totals.get(city) || 0) + row.count);
    }
  }

  return [...totals.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Emergency request breakdown by category, with percentage of total —
// used for "Help Request Categories".
async function getRequestCategoryBreakdown() {
  const rows = await EmergencyRequest.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return rows.map((r) => ({
    category: r._id,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));
}

module.exports = {
  getOverviewStats,
  getDonorsByBloodGroup,
  getCityWiseActivity,
  getRequestCategoryBreakdown,
};
