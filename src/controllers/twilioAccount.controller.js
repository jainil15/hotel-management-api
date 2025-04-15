const { responseHandler } = require("../middlewares/response.middleware");
const twilioService = require("../services/twilioAccount.service");
const twilio = require('twilio');

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
    const messageCount = await twilioService.getMessageCount(twilioAccount.sid, twilioAccount.authToken);
    
    if (messageCount === -1) {
      return next(new NotFoundError("Failed to fetch Twilio message count", {}));
    }

    console.log("Message Count:", messageCount);
    return responseHandler(res, {
      phoneNumber: twilioAccount.phoneNumber,
      countryCode: twilioAccount.countryCode,
      propertyId: twilioAccount.propertyId,
      status: twilioAccount.status,
      twilioId: twilioAccount.sid,
      messageCount,
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { getByPropertyId };
