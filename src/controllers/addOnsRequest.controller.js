const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const addOnsRequestService = require("../services/addOnsRequest.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const guestService = require("../services/guest.service");
const propertyService = require("../services/property.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const { sendMail } = require("../utils/mail.util");

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
const {
  modifyAddOnsMessageTemplateBody,
} = require("../utils/messageTemplateUpdate");

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
  let newMessage, chatList; // Declare outside try-catch so they are accessible in the finally block

  try {
    const { propertyId, guestId, addOnsRequestId } = req.params;
    const { requestStatus } = req.body;
    console.log("requestStatus", requestStatus);

    // Validate the requestStatus
    const requestStatusResult = z
      .object({
        requestStatus: z.enum([
          REQUEST_STATUS.ACCEPTED,
          REQUEST_STATUS.DECLINED,
        ]),
      })
      .safeParse({ requestStatus });

    if (!requestStatusResult.success) {
      throw new ValidationError(
        "Validation Error",
        requestStatusResult.error.flatten().fieldErrors,
      );
    }

    // Fetch the existing add-ons request
    const existingAddOnsRequest = await addOnsRequestService.getById(
      propertyId,
      guestId,
      addOnsRequestId,
    );

    if (!existingAddOnsRequest) {
      throw new APIError("Add Ons Request not found", {});
    }
    console.log("Add Ons Request", existingAddOnsRequest);

    // Update the add-ons request status
    const updatedAddOnsRequest = await addOnsRequestService.update(
      propertyId,
      guestId,
      addOnsRequestId,
      { requestStatus },
      session,
    );

    // Fetch guest details
    const oldGuest = await guestService.getById(guestId, propertyId);

    // Check if SMS needs to be sent
    if (oldGuest.phoneNumber && oldGuest.countryCode) {
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const messageTemplate =
        await messageTemplateService.getMessageTemplateByStatus(
          propertyId,
          `AddOns ${requestStatus === REQUEST_STATUS.ACCEPTED ? "Accepted" : "Rejected"}`,
        );

      const { property } = await propertyService.getById(propertyId);
      const messageBody = modifyAddOnsMessageTemplateBody(
        messageTemplate,
        property,
        oldGuest,
        updatedAddOnsRequest,
      );

      const sentSms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${oldGuest.countryCode}${oldGuest.phoneNumber}`,
        // `Your request for ${existingAddOnsRequest.name} addon is ${requestStatus.toLowerCase()}`,
        messageBody.message,
      );
      // Create the new message
      newMessage = await messageService.create(
        {
          propertyId,
          guestId,
          senderId: propertyId,
          receiverId: guestId,
          content: messageBody.message,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          messageType: messageType.SMS,
          messageSid: sentSms.sid,
        },
        session,
      );
      if (oldGuest.email) {
        sendMail(
          oldGuest.email,
          `Add Ons ${updatedAddOnsRequest.name} ${requestStatus}`,
          messageBody.message,
        );
      }

      // Update the chat list
      chatList = await chatListService.update(
        propertyId,
        guestId,
        { latestMessage: newMessage._id },
        session,
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
      message: newMessage
        ? newMessage
        : "Message not sent since phone number is not available",
    });

    req.app.io.to(`property:${propertyId}`).emit("guest:guestStatusUpdate", {
      guestStatus: updatedAddOnsRequest,
    });

    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList,
    });

    return responseHandler(res, { addOnsRequest: updatedAddOnsRequest });
  } catch (e) {
    // Rollback transaction in case of error
    console.log(e);
    await session.abortTransaction();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  } finally {
    // Ensure the session is properly ended whether the transaction is successful or not
    session.endSession();
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
    console.log(e);
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
