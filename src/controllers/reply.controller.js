const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { CreateReplyValidationSchema } = require("../models/reply.model");
const replyService = require("../services/reply.service");
const guestService = require("../services/guest.service");
const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const smsService = require("../services/sms.service");
const reviewService = require("../services/review.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");

const {
  messageTriggerType,
  messageType,
} = require("../constants/message.constant");

/**
 * Create a new reply
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - NextFunction
 * @returns {Promise<import('express').Response>} - Response
 */

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let newMessage, chatList;
  try {
    const { reviewId, guestId, ...reply } = req.body;
    const propertyId = req.params.propertyId;

    //Validate Reply
    const replyResult = CreateReplyValidationSchema.safeParse(reply);
    if (!replyResult.success) {
      throw new ValidationError(
        "Validation Error",
        replyResult.error.flatten().fieldErrors,
      );
    }

    const createdReply = await replyService.create(
      propertyId,
      guestId,
      reviewId,
      reply,
      session,
    );

    const review = await reviewService.getById(reviewId);
    const guest = await guestService.getByGuestId(guestId);
    const messageContent = `Hello! Thank you for your review: ${review.comments}.\nOur team has seen it and replied: ${createdReply.reply}\nWe appreciate your feedback and are always here to help!`;
    if (guest.phoneNumber && guest.countryCode) {
      const twilioAccount =
        await twilioAccountService.getByPropertyId(propertyId);
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);


      const sms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${guest.countryCode}${guest.phoneNumber}`,
        messageContent
      );
      
      newMessage = await messageService.create(
        {
          propertyId,
          guestId,
          senderId: propertyId,
          receiverId: guestId,
          content: messageContent,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          messageType: messageType.REVIEW_REPLY,
          messageSid: sms.sid,
        },
        session,
      );

      chatList = await chatListService.update(
        propertyId,
        guestId,
        { latestMessage: newMessage._id },
        session,
      );
    }

    await session.commitTransaction();

    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {
      message: newMessage
        ? newMessage
        : "Message not sent since phone number is not available",
    });

    req.app.io.to(`property:${propertyId}`).emit("review:replyCreated", {
      reviewReply: createdReply,
    });

    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList,
    });

    return responseHandler(res, { reply: createdReply }, 201, "Reply Created");
  } catch (e) {
    await session.abortTransaction();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  } finally {
    session.endSession();
  }
};

const getByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const replies = await replyService.getByPropertyId(propertyId);
    return responseHandler(res, { replies }, 200);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getByReviewId = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const replies = await replyService.getByReviewId(reviewId);
    return responseHandler(res, { replies }, 200);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  create,
  getByPropertyId,
  getByReviewId,
};
