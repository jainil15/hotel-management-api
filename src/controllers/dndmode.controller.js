const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const guestService = require("../services/guest.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");

const dndModeRequestService = require("../services/dndmode.service");
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
  let newMessage, chatList;

  try {
    const { propertyId, guestId, dndModeRequestId } = req.params;
    const { requestStatus } = req.body;
    if (!["Accepted", "Declined"].includes(requestStatus)) {
      throw new ValidationError("Invalid Dndmode", {
        dndmode: ["Invalid Dndmode"],
      });
    }

    // Fetch the existing add-ons request
    const guestDndModeStatus = await guestService.updatedGuestDndStatus(
      propertyId,
      guestId,
      requestStatus,
      session,
    );

    // Update the add-ons request status
    const updateddndModeRequest = await dndModeRequestService.update(
      propertyId,
      guestId,
      { requestStatus },
      session,
    );

    // Fetch guest details
    const oldGuest = await guestService.getById(guestId, propertyId);
    //console.log(oldGuest);
    // Check if SMS needs to be sent
    if (oldGuest.phoneNumber && oldGuest.countryCode) {
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      let smsContent = "";
      if (requestStatus === "Accepted" && guestDndModeStatus.dndmode) {
        smsContent = `Your Do Not Disturb Mode has been activated. Our staff will not disturb your stay in room ${oldGuest.roomNumber} until you turn it off or until ${new Date(
          oldGuest.checkOut,
        ).toLocaleString("en", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        })}.`;
      } else if (requestStatus === "Accepted" && !guestDndModeStatus.dndmode) {
        smsContent = `Your Do Not Disturb Mode has been deactivated. Our staff will resume services for your stay in room ${oldGuest.roomNumber}.`;
      } else if (requestStatus === "Declined" && !guestDndModeStatus.dndmode) {
        smsContent = `Your Do Not Disturb Mode request has been declined`;
      } else if (requestStatus === "Declined" && guestDndModeStatus.dndmode) {
        smsContent = `Your Ending of Do Not Disturb Mode request has been declined.`;
      }
      const sentSms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${oldGuest.countryCode}${oldGuest.phoneNumber}`,
        smsContent,
      );

      newMessage = await messageService.create(
        {
          propertyId,
          guestId,
          senderId: propertyId,
          receiverId: guestId,
          content: smsContent,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          messageType: messageType.SMS,
          messageSid: sentSms.sid,
        },
        session,
      );

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
      guestStatus: updateddndModeRequest,
    });

    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList,
    });

    return responseHandler(res, { dndModeRequest: updateddndModeRequest });
  } catch (e) {
    // Rollback transaction in case of error
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

const getdndmodeRequestStatus = async (req, res, next) => {
  try {
    const { propertyId, guestId } = req.guestSession;
    const dndmodeRequest =
      await dndModeRequestService.getByPropertyIdAndGuestId(
        propertyId,
        guestId,
      );
    return responseHandler(res, dndmodeRequest);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  update,
  getdndmodeRequestStatus,
};
