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
const {
  guestStatusToTemplate,
  guestStatusToTemplateOnUpdate,
} = require("../utils/guestStatustToTemplate");
const messageTemplateService = require("../services/messageTemplate.service");
const smsService = require("../services/sms.service");
const {
  messageTriggerType,
  requestType,
  messageType,
} = require("../constants/message.constant");

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
    console.log("Add Ons Request", existingAddOnsRequest);
    const updatedAddOnsRequest = await addOnsRequestService.update(
      propertyId,
      guestId,
      addOnsRequestId,
      { requestStatus },
      session,
    );
    // const messageTemplateName = guestStatusToTemplateOnUpdate(
    //   oldGuestStatus,
    //   updatedGuestStatus,
    // );
    const oldGuest = await guestService.getById(guestId, propertyId);
    // const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
    //   propertyId,
    //   messageTemplateName,
    // );
    // if (!messageTemplate) {
    //   await session.commitTransaction();
    //   session.endSession();
    //   req.app.io.to(`property:${propertyId}`).emit("guest:guestStatusUpdate", {
    //     guestStatus: updatedGuestStatus,
    //   });
    //   return responseHandler(res, {
    //     checkInOutRequest: updatedCheckInOutRequest,
    //   });
    // }
    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);
    const twilioSubClient = await twilioService.getTwilioClient(twilioAccount);
    const sentSms = await smsService.send(
      twilioSubClient,
      `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
      `${oldGuest.countryCode}${oldGuest.phoneNumber}`,
      `Your request for addon is ${requestStatus.toLowerCase()}`,
    );
    const newMessage = await messageService.create(
      {
        propertyId: propertyId,
        guestId: guestId,
        senderId: propertyId,
        receiverId: guestId,
        content: `Your request for addon is ${requestStatus.toLowerCase()}`,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        messageType: messageType.SMS,
        messageSid: sentSms.sid,
      },
      session,
    );

    const chatList = await chatListService.update(
      propertyId,
      guestId,
      {
        latestMessage: newMessage._id,
      },
      session,
    );

    // TODO: Send message to the guest
    await session.commitTransaction();
    session.endSession();
    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
      message: newMessage,
    });

    req.app.io.to(`property:${propertyId}`).emit("guest:guestStatusUpdate", {
      guestStatus: updatedAddOnsRequest,
    });

    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: chatList,
    });
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
