const analyticsService = require("../services/analytics.service");
const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");

const getAnalytics = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const analyticsData = await analyticsService.getAnalytics(propertyId);
    return responseHandler(res, analyticsData);
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e));
  }
};

const getQrCodeScannedPerRoom = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { date } = req.query;
    console.log(new Date(date));
    const qrCodeScannedPerRoom = await analyticsService.getQrCodeScannedPerRoom(
      propertyId,
      date,
    );
    return responseHandler(res, qrCodeScannedPerRoom);
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
  getQrCodeScannedPerRoom,
};
