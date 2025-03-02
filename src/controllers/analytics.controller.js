const analytics = require("../services/analytics.service");
const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");

const getAnalytics = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const analyticsData = await analytics.getAnalytics(propertyId);
    return responseHandler(res, analyticsData);
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e));
  }
};

module.exports = {
  getAnalytics,
};
