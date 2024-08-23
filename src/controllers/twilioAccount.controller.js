const { responseHandler } = require("../middlewares/response.middleware");
const twilioService = require("../services/twilioAccount.service");
const {
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const getByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const twilioAccount = await twilioService.getByPropertyId(propertyId);
    if (!twilioAccount) {
      return next(new NotFoundError("Twilio Account not found", {}));
    }
    return responseHandler(res, {
      phoneNumber: twilioAccount.phoneNumber,
      countryCode: twilioAccount.countryCode,
      propertyId: twilioAccount.propertyId,
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { getByPropertyId };
