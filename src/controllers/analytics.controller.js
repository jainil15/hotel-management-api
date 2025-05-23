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

const getAnalyticsDetails = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { type, date } = req.query;
    switch (type) {
      case "service": {
        const addOnsRequestPerRoom =
          await analyticsService.getAddOnsRequestPerRoom(propertyId, date);
        const checkInOutRequestPerRoom =
          await analyticsService.getCheckInOutRequestPerRoom(propertyId, date);
        const uniqueRoomNumbers = [
          ...new Set([
            ...addOnsRequestPerRoom.map((item) => item.roomNumber),
            ...checkInOutRequestPerRoom.map((item) => item.roomNumber),
          ]),
        ];

        const mergedList = uniqueRoomNumbers.map((roomNumber) => {
          const addOns = addOnsRequestPerRoom.find(
            (addOns) => addOns.roomNumber === roomNumber,
          );
          const checkInOut = checkInOutRequestPerRoom.find(
            (checkInOut) => checkInOut.roomNumber === roomNumber,
          );
          return {
            roomNumber: roomNumber,
            total:
              (addOns ? addOns.total : 0) + (checkInOut ? checkInOut.total : 0),
          };
        });
        return responseHandler(res, mergedList);
      }
      case "houseKeeping": {
        const houseKeepingRequestPerRoom =
          await analyticsService.getHouseKeepingRequestPerRoom(
            propertyId,
            date,
          );
        return responseHandler(res, houseKeepingRequestPerRoom);
      }
      case "qrCode": {
        const qrCodeScannedPerRoom =
          await analyticsService.getQrCodeScannedPerRoom(propertyId, date);
        return responseHandler(res, qrCodeScannedPerRoom);
      }
      case "currentInHouseGuests": {
        const currentInHouseGuests =
          await analyticsService.getCurrentInHouseGuests(propertyId, date);
        return responseHandler(res, currentInHouseGuests);
      }
      default:
        throw new NotFoundError("Invalid type", { type: ["Invalid Type"] });
    }
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
  getAnalyticsDetails,
};
