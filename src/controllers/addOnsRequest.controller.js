const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const addOnsRequestService = require("../services/addOnsRequest.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const guestService = require("../services/guest.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");

const { z } = require("zod");
const { responseHandler } = require("../middlewares/response.middleware");
const { default: mongoose } = require("mongoose");

/**
 * Update the status of the add ons request
 * @param {import('express).Request} req - Request
 * @param {import('express).Response} res - Response
 * @param {import('express).NextFunction} next - NextFunction
 * @returns {Promise<import('express').Response>} - Response
 */
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId, addOnsRequestId } = req.params;
    const { requestStatus } = req.body;
    console.log("requestStatus", requestStatus);
    const requestStatusResult = z
      .object({
        requestStatus: z.enum([
          REQUEST_STATUS.ACCEPTED,
          REQUEST_STATUS.DECLINED,
        ]),
      })
      .safeParse({
        requestStatus,
      });
    if (!requestStatusResult.success) {
      throw new ValidationError(
        "Validation Error",
        requestStatusResult.error.flatten().fieldErrors,
      );
    }
    const existingAddOnsRequest = await addOnsRequestService.getById(
      propertyId,
      guestId,
      addOnsRequestId,
    );
    if (!existingAddOnsRequest) {
      throw new APIError("Add Ons Request not found", {});
    }
    const updatedAddOnsRequest = await addOnsRequestService.update(
      propertyId,
      guestId,
      addOnsRequestId,
      { requestStatus },
      session,
    );

    // TODO: Send message to the guest
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { addOnsRequest: updatedAddOnsRequest });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get all add ons requests by property id
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - NextFunction
 * @returns {Promise<import('express').Response>} - Response
 */
const getAllByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { requestStatus } = req.query;
    const addOnsRequests = await addOnsRequestService.getAllByPropertyId(
      propertyId,
      requestStatus,
    );
    return responseHandler(res, { addOnsRequests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  update,
  getAllByPropertyId,
};
