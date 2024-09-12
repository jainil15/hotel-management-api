const { z } = require("zod");

const twilioAccountService = require("../services/twilioAccount.service");
const twilioService = require("../services/twilio.service");
const messageService = require("../services/message.service");
const chatListService = require("../services/chatList.service");
const guestService = require("../services/guest.service");
const propertyService = require("../services/property.service");
const twilio = require("twilio");
const querystring = require("querystring");
const { phoneregex } = require("../constants/regex.constant");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  NotFoundError,
  APIError,
  ValidationError,
  BadRequestError,
  InternalServerError,
  ConflictError,
} = require("../lib/CustomErrors");
const { mongo, default: mongoose } = require("mongoose");
const {
  messageTriggerType,
  messageType,
} = require("../constants/message.constant");
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
} = require("../constants/twilio.constant");

/**
 * Get phone numbers from Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getPhoneNumbers = async (req, res, next) => {
  try {
    const country = req.query.country;
    const allPhoneNumbers = await twilioService.getPhoneNumbers(country);
    console.log(allPhoneNumbers);
    const phoneNumbers = allPhoneNumbers.map((phoneNumber) => ({
      phoneNumber: phoneNumber.phone_number,
      friendlyName: phoneNumber.friendly_name,
    }));
    return responseHandler(res, { phoneNumbers: phoneNumbers });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Buy phone number from Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const buyPhoneNumber = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const phoneNumber = req.body.phoneNumber;

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new NotFoundError("Property not found", {});
    }
    // Check if property exists
    const twilioAccount = await TwilioAccount.findOne({
      propertyId: propertyId,
    });
    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {});
    }
    // Check if Twilio Account already has a phone number
    if (twilioAccount.phoneNumber) {
      throw new ConflictError("Twilio Account already has a phone number", {
        phoneNumber: ["Twilio Account already has a phone number"],
      });
    }
    const result = z
      .object({
        phoneNumber: z.string().refine((val) => phoneregex.test(val), {
          message: "Invalid phone number format",
        }),
      })
      .safeParse({ phoneNumber });
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors,
      );
    }
    const boughtPhoneNumber = await twilioService.buyPhoneNumber(
      propertyId,
      phoneNumber,
      req.user,
    );

    return responseHandler(res, {}, 201, "Successfully bought phonenumber");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Create subaccount for Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const createSubaccount = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      throw new BadRequestError("Property ID is required", {
        propertyId: ["Property ID is required"],
      });
    }
    const subaccount = await twilioService.createSubaccount(propertyId);
    return responseHandler(
      res,
      { subaccount },
      201,
      "Twilio subaccount Created",
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Get toll free verification status from Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getTollFreeVerificationStatus = async (twilioClient, twilioAccount) => {
  const tollfreeVerification = await twilioClient.messaging.v1
    .tollfreeVerifications(twilioAccount.tollfreeVerificationSid)
    .fetch();

  if (!tollfreeVerification.status) {
    throw new NotFoundError("Toll Free Verification not found", {
      propertyId: [
        "Toll Free Verification not found for the given property id",
      ],
    });
  }

  const verificationDetails = {
    status: tollfreeVerification.status,
    errorCode: tollfreeVerification.errorCode || "No error code",
  };

  return verificationDetails;
};


/**
 * Send message to guest from property - Maybe not used
 * @deprecated
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const sendMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const propertyId = req.params.propertyId;
    const guestId = req.body.guestId;
    const body = req.body.body;

    const newMessage = await twilioService.sendMessage(
      propertyId,
      guestId,
      body,
      session,
    );

    return responseHandler(res, {}, 201, "Message sent successfully");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Incoming message from Twilio - Maybe not used
 * @deprecated
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const incomingMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { From, To, Body } = req.body;
    const message = {
      from: From,
      to: To,
      body: Body,
    };

    const property = await propertyService.find({
      propertyId: To.substring(req.body.To.length - 10),
    });
    if (!property) {
      throw new NotFoundError("Property not found", {
        propertyId: ["Property not found for the given id"],
      });
    }
    const guest = await guestService.find({
      phoneNumber: From.substring(req.body.To.length - 10),
      propertyId: property._id,
    });

    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }

    const newMessage = await messageService.create({
      propertyId: property._id,
      guestId: guest._id,
      senderId: guest._id,
      receiverId: property._id,
      content: Body,
      messageTriggerType: messageTriggerType.MANUAL,
      messageType: messageType.SMS,
    });

    const updatedChatList = await chatListService.updateAndIncUnreadMessages(
      guest._id,
      property._id,
      {
        latestMessage: newMessage._id,
      },
      session,
    );

    req.app.io.to(`guest:${guest._id}`).emit("message:newMessage", {
      message: newMessage,
    });

    req.app.io.to(`property:${property._id}`).emit("chatList:update", {
      chatList: updatedChatList,
    });

    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { message });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Get subaccount billing from Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const subaccountBilling = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);
    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {
        propertyId: ["Twilio account found for the given property id"],
      });
    }
    // TODO: Move client gen to twilio.service
    const twilioSubClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
      accountSid: twilioAccount.sid,
    });

    const billing = await twilioService.subaccountBilling(twilioSubClient);
    return responseHandler(res, { billing });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const isTwilioSetup = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);
    if (!twilioAccount) {
      return responseHandler(res, {
        isComplete: false,
        isSubaccountCreated: false,
      });
    }
    if (twilioAccount.phoneNumber) {
      return responseHandler(res, {
        isComplete: true,
        isSubaccountCreated: true,
      });
    }

    if (twilioAccount.sid) {
      return responseHandler(res, {
        isComplete: false,
        isSubaccountCreated: true,
      });
    }

    return responseHandler(res, {
      isComplete: false,
      isSubaccountCreated: false,
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};


/**
 * Resubmit Toll-Free Verification for Twilio
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const resubmitTollFreeVerification = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const tollFreeNumber = req.body.tollFreeNumber;

    // Validate toll-free number format
    const result = z
      .object({
        tollFreeNumber: z.string().refine((val) => phoneregex.test(val), {
          message: "Invalid toll-free number format",
        }),
      })
      .safeParse({ tollFreeNumber });

    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors,
      );
    }

    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new NotFoundError("Property not found", {});
    }

    // Find the Twilio account associated with the property
    const twilioAccount = await TwilioAccount.findOne({ propertyId: propertyId });
    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {});
    }

    // Check if the toll-free number is already verified
    if (twilioAccount.tollFreeVerified) {
      throw new ConflictError("Toll-free number already verified", {
        tollFreeNumber: ["Toll-free number is already verified"],
      });
    }

    // Resubmit toll-free verification request
    const resubmittedVerification = await twilioService.resubmitTollFreeVerification(
      twilioAccount.tollfreeVerificationSid,
    );

    return responseHandler(res, resubmittedVerification, 201, "Toll-free verification resubmitted successfully");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};


module.exports = {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
  getTollFreeVerificationStatus,
  sendMessage,
  incomingMessage,
  isTwilioSetup,
  subaccountBilling,
  resubmitTollFreeVerification,
};
