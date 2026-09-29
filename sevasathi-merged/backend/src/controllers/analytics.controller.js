const analyticsService = require('../services/analytics.service');
const { asyncHandler } = require('../utils/asynchandler');

// Single endpoint returning everything the Analytics dashboard needs,
// computed together so the page doesn't have to fire 4 separate requests.
exports.getDashboard = asyncHandler(async (req, res) => {
  const [overview, donorsByBloodGroup, cityWiseActivity, requestCategoryBreakdown] = await Promise.all([
    analyticsService.getOverviewStats(),
    analyticsService.getDonorsByBloodGroup(),
    analyticsService.getCityWiseActivity(),
    analyticsService.getRequestCategoryBreakdown(),
  ]);

  res.status(200).json({
    message: 'Analytics fetched successfully',
    overview,
    donorsByBloodGroup,
    cityWiseActivity,
    requestCategoryBreakdown,
  });
});
