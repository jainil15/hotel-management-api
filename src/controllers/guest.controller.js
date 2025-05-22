const { default: mongoose } = require("mongoose");
const {
  CreateGuestValidationSchema,
  UpdateGuestValidationSchema,
  GuestSelfRegistrationValidationSchema,
} = require("../models/guest.model");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant");
const messageTemplateService = require("../services/messageTemplate.service");
const addOnsRequestService = require("../services/addOnsRequest.service");
const messageService = require("../services/message.service");
const smsService = require("../services/sms.service");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const guestTokenService = require("../services/guestToken.service");
const guestSessionService = require("../services/guestSession.service");
const settingService = require("../services/setting.service");
const twilioService = require("../services/twilio.service");
const twilioAccountService = require("../services/twilioAccount.service");
const chatListService = require("../services/chatList.service");
const propertyService = require("../services/property.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const { modifyMessageTemplateBody } = require("../utils/messageTemplateUpdate");
//new

const preArrivalService = require("../services/preArrival.service"); // Pre-arrival service
const addOnsServices = require("../services/addOnsRequest.service"); // Add-ons service

const {
  CreateGuestStatusValidationSchema,
  UpdateGuestStatusValidationSchema,

  GetGuestFiltersValidationSchema,
} = require("../models/guestStatus.model");
const logger = require("../configs/winston.config");

const { responseHandler } = require("../middlewares/response.middleware");
const {
  APIError,
  InternalServerError,
  ValidationError,
  NotFoundError,
} = require("../lib/CustomErrors");

const { validateStatus, validateUpdate } = require("../utils/guestStatus.util");
const { z } = require("zod");
const {
  guestStatusToTemplateOnCreate,
  guestStatusToTemplateOnUpdate,
  guestTimingUpdate,
} = require("../utils/guestStatustToTemplate");
const {
  GUEST_REQUEST,
  REQUEST_STATUS,
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
} = require("../constants/guestStatus.contant");
const { compareDate } = require("../utils/dateCompare");
require("dotenv").config();

/**
 * Get all guests by property id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getAll = async (req, res, next) => {
  try {
    const guests = await guestService.getAll(req.params.propertyId);
    return responseHandler(res, { guests: guests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Create a new guest
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // TODO: add messageGuest
    const { sendMessage, status, ...guest } = req.body;
    const propertyId = req.params.propertyId;

    // Validate guest and status
    const guestResult = CreateGuestValidationSchema.safeParse(guest);
    const statusResult = CreateGuestStatusValidationSchema.safeParse(status);
    const sendMessageResult = z.boolean().optional().safeParse(sendMessage);
    const roomNumberResult =
      status.currentStatus === GUEST_CURRENT_STATUS.RESERVED
        ? z.string().optional().safeParse(status.roomNumber)
        : z
            .string()
            .optional()
            .superRefine((args, ctx) => {
              if (guest.roomNumber === undefined) {
                ctx.addIssue({
                  path: ["roomNumber"],
                  code: "invalid_room_number",
                  message: "Room number is required",
                });
              }
            })
            .safeParse(status.roomNumber);
    // Validate guest and status
    if (
      !guestResult.success ||
      !statusResult.success ||
      !sendMessageResult.success ||
      !roomNumberResult.success
    ) {
      console.log("Error", guestResult?.error?.flatten().fieldErrors);
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...statusResult?.error?.flatten().fieldErrors,
        ...sendMessageResult?.error?.flatten().fieldErrors,
        ...roomNumberResult?.error?.flatten().fieldErrors,
      });
    }
    if (
      req.body?.status?.currentStatus !== "Reservation" &&
      !req.body?.phoneNumber
    ) {
      throw new ValidationError("Phone number is required", {
        phoneNumber: ["Phone number is required"],
      });
    }

    const existingInHouseGuest = await guestService.findWithStatus(
      {
        phoneNumber: guest.phoneNumber,
        countryCode: guest.countryCode,
        propertyId: propertyId,
      },
      {
        currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
        reservationStatus: RESERVATION_STATUS.CONFIRMED,
      },
    );
    console.log("Exisint guest  inhouse confirmed", existingInHouseGuest);
    if (existingInHouseGuest.length > 0) {
      throw new ValidationError("Guest already exists with this phone number", {
        phoneNumber: ["Guest already exists with this phone number"],
      });
    }
    const existingReservedGuest = await guestService.findWithStatus(
      {
        phoneNumber: guest.phoneNumber,
        countryCode: guest.countryCode,
        propertyId: propertyId,
      },
      {
        currentStatus: GUEST_CURRENT_STATUS.RESERVED,
        reservationStatus: RESERVATION_STATUS.CONFIRMED,
      },
    );
    console.log("Exisint guest  reservation confirmed", existingInHouseGuest);
    if (existingReservedGuest.length > 0) {
      throw new ValidationError("Guest already exists with this phone number", {
        phoneNumber: ["Guest already exists with this phone number"],
      });
    }

    // Check if status is valid
    //if (!validateStatus(status)) {
    //  throw new ValidationError("Invalid Status", {
    //		currentStatus: "Invalid Status",
    //	});
    //}

    // Create guest
    const newGuest = await guestService.create(guest, propertyId, session);

    // Create guest status
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      status,
      session,
    );
    // Create Guest Session
    const guestSession = await guestSessionService.create(
      propertyId,
      newGuest._id,
      session,
    );
    // Create chat list
    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );

    // todo: move to sms.service
    // Send message to the guest
    const { property } = await propertyService.getById(propertyId);
    // const message = `Welcome to ${property.name}.\nYour guest portal link is: ${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`;
    // await twilioService.sendAccessLink(
    //   propertyId,
    //   `${newGuest.countryCode + newGuest.phoneNumber}`,
    //   message,
    // );
    // TODO: Workflow message trigger
    // if (sendMessage === true) {
    // }
    //await session.commitTransaction();
    //session.startTransaction();

    // Send message to the guest according to the status
    if (sendMessage === true && guest.phoneNumber && guest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(newGuestStatus),
        );
      if (messageTemplate) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          newGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${newGuest.countryCode}${newGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );
        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: newGuest._id,
            senderId: propertyId,
            receiverId: newGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );
        const updatedChatList =
          await chatListService.updateAndIncUnreadMessages(
            propertyId,
            newGuest._id,
            {
              latestMessage: newMessage._id,
            },
            session,
            0,
          );
      }
    }
    await session.commitTransaction();
    session.endSession();

    // Trigger events
    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: chatList,
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${newGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    return responseHandler(
      res,
      { guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } } },
      201,
      "Guest Created",
    );
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
 * Get guest by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getById = async (req, res, next) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;
    const guest = await guestService.getById(guestId, propertyId);
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    return responseHandler(res, {
      guest: { ...guest._doc, status: guestStatus },
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Update guest by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // TODO: add messageGuest
    let { sendMessage, status, ...guest } = req.body;
    const propertyId = req.params.propertyId;
    const guestId = req.params.guestId;
    if (guest.email === "") {
      const { email, ...temp } = guest;
      guest = temp;
    }
    if (guest.confirmationNumber === "") {
      const { confirmationNumber, ...temp } = guest;
      guest = temp;
    }
    if (guest.source === "") {
      const { source, ...temp } = guest;
      guest = temp;
    }

    const guestResult = await UpdateGuestValidationSchema.safeParseAsync(guest);
    const statusResult =
      await UpdateGuestStatusValidationSchema.safeParseAsync(status);
    const roomNumberResult =
      status.currentStatus === GUEST_CURRENT_STATUS.RESERVED
        ? z.string().optional().safeParse(status.roomNumber)
        : z
            .string()
            .optional()
            .superRefine((args, ctx) => {
              if (guest.roomNumber === undefined) {
                ctx.addIssue({
                  path: ["roomNumber"],
                  code: "invalid_room_number",
                  message: "Room number is required",
                });
              }
            })
            .safeParse(status.roomNumber);
    if (
      !guestResult.success ||
      !statusResult.success ||
      !roomNumberResult.success
    ) {
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...statusResult?.error?.flatten().fieldErrors,
        ...roomNumberResult?.error?.flatten().fieldErrors,
      });
    }
    let checkCheckInUpdated = false;
    let checkCheckOutUpdated = false;
    const guestInfo = await guestService.getById(guestId, propertyId);
    const updatedGuest = await guestService.update(
      guest,
      propertyId,
      guestId,
      session,
    );
    if (
      new Date(guestInfo.checkIn).getTime() !==
      new Date(updatedGuest.checkIn).getTime()
    ) {
      checkCheckInUpdated = true;
    }

    if (
      new Date(guestInfo.checkOut).getTime() !==
      new Date(updatedGuest.checkOut).getTime()
    ) {
      checkCheckOutUpdated = true;
    }
    const oldGuestStatus = await guestStatusService.getByGuestId(guestId);
    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session,
    );
    if (
      req.body?.status?.currentStatus !== "Reservation" &&
      !req.body?.phoneNumber
    ) {
      throw new ValidationError("Phone number is required", {
        phoneNumber: ["Phone number is required"],
      });
    }
    // Check for early check in or late check out
    const existingCheckInOutRequests =
      await checkInOutRequestService.getByPropertyIdAndGuestId(
        propertyId,
        guestId,
      );
    for (const existingCheckInOutRequest of existingCheckInOutRequests) {
      if (
        updatedGuestStatus[`${existingCheckInOutRequest.requestType}Status`] !==
        oldGuestStatus[`${existingCheckInOutRequest.requestType}Status`]
      ) {
        if (
          existingCheckInOutRequest.requestStatus === REQUEST_STATUS.REQUESTED
        ) {
          if (
            updatedGuestStatus[
              `${existingCheckInOutRequest.requestType}Status`
            ] === REQUEST_STATUS.ACCEPTED
          ) {
            if (
              compareDate(
                existingCheckInOutRequest[
                  `${existingCheckInOutRequest.requestType}DateTime`
                ],
                updatedGuest[
                  `${existingCheckInOutRequest.requestType
                    .match(/[A-Z][a-z]+/g)
                    .join("")
                    .replace("C", "c")}`
                ],
              )
            ) {
              await checkInOutRequestService.updateRequestStatus(
                propertyId,
                existingCheckInOutRequest._id,
                {
                  requestStatus: REQUEST_STATUS.ACCEPTED,
                },
                session,
              );
            } else {
              console.log(
                existingCheckInOutRequest[
                  `${existingCheckInOutRequest.requestType}DateTime`
                ],
                existingCheckInOutRequest.requestType
                  .match(/[A-Z][a-z]+/g)
                  .join("")
                  .replace("C", "c"),
                updatedGuest[
                  `${existingCheckInOutRequest.requestType
                    .match(/[A-Z][a-z]+/g)
                    .join("")
                    .replace("C", "c")}`
                ],
              );
              throw new ValidationError(
                `${existingCheckInOutRequest.requestType.match(/[A-Z][a-z]+/g).join(" ")} requested for ${existingCheckInOutRequest[
                  existingCheckInOutRequest.requestType + "DateTime"
                ].toISOString()}`,
                {
                  [`${existingCheckInOutRequest.requestType}DateTime`]: [
                    "Requested date time mismatch",
                  ],
                },
              );
            }
          } else if (
            updatedGuestStatus[
              `${existingCheckInOutRequest.requestType}Status`
            ] === REQUEST_STATUS.DECLINED
          ) {
            await checkInOutRequestService.updateRequestStatus(
              propertyId,
              existingCheckInOutRequest._id,
              {
                requestStatus: REQUEST_STATUS.DECLINED,
              },
              session,
            );
          }
        }
      }
    }
    // Send message to the guest according to the status
    if (sendMessage === true && guest.phoneNumber && guest.countryCode) {
      const { property } = await propertyService.getById(propertyId);
      if (checkCheckInUpdated || checkCheckOutUpdated) {
        const guestSession = await guestSessionService.getGuestSession(
          propertyId,
          guestId,
        );
        const messageTemplate =
          await messageTemplateService.getByNameAndPropertyId(
            propertyId,
            guestTimingUpdate(guestInfo, updatedGuest),
          );

        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          throw new NotFoundError("Twilio account not found", {
            propertyId: ["Twilio account not found for this property"],
          });
        }

        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          updatedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );

        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: updatedGuest._id,
            senderId: propertyId,
            receiverId: updatedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );

        await chatListService.updateAndIncUnreadMessages(
          propertyId,
          updatedGuest._id,
          {
            latestMessage: newMessage._id,
          },
          session,
          0,
        );
      }
      // Get Message Template
      const guestSession = await guestSessionService.getGuestSession(
        propertyId,
        guestId,
      );
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, updatedGuestStatus),
        );
      // Send Message
      if (messageTemplate && guest.phoneNumber && guest.countryCode) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          throw new NotFoundError("Twilio account not found", {
            propertyId: ["Twilio account not found for this property"],
          });
        }
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          updatedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );

        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: updatedGuest._id,
            senderId: propertyId,
            receiverId: updatedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );

        await chatListService.updateAndIncUnreadMessages(
          propertyId,
          updatedGuest._id,
          {
            latestMessage: newMessage._id,
          },
          session,
          0,
        );
      }
    }
    await session.commitTransaction();
    session.endSession();

    // Trigger events
    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: updatedGuestStatus },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest messages updated
    req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {});
    return responseHandler(
      res,
      {
        guest: { ...updatedGuest._doc, status: updatedGuestStatus },
      },
      200,
      "Guest Updated",
    );
  } catch (e) {
    console.log("eeeeeeeeeee", e);
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Remove guest by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.params;

    const removedGuest = await guestService.remove(
      guestId,
      propertyId,
      session,
    );
    const removedGuestStatus = await guestStatusService.remove(
      guestId,
      session,
    );
    const removedChatList = await chatListService.remove(
      propertyId,
      guestId,
      session,
    );

    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...removedGuest._doc, status: removedGuestStatus },
    });
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: removedChatList,
    });
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { guest: removedGuest });
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
 * Get all guests with status
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getAllGuestsWithStatus = async (req, res, next) => {
  try {
    const filters = req.query;
    const filtersResult = GetGuestFiltersValidationSchema.safeParse(filters);
    const propertyId = req.params.propertyId;
    if (!filtersResult.success) {
      throw new ValidationError(
        "Validation Error",
        filtersResult.error.flatten().fieldErrors,
      );
    }

    // let guests = await guestService.getAllGuestsWithStatus(propertyId);
    const guests = await guestStatusService.getAllGuestWithStatusv2(
      propertyId,
      filtersResult.data,
    );

    return responseHandler(res, { guests: guests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getCheckInOutPendingGuests = async (req, res, next) => {
  try {
    const filters = req.query;
    const filtersResult = GetGuestFiltersValidationSchema.safeParse(filters);
    const propertyId = req.params.propertyId;
    if (!filtersResult.success) {
      throw new ValidationError(
        "Validation Error",
        filtersResult.error.flatten().fieldErrors,
      );
    }

    // let guests = await guestService.getAllGuestsWithStatus(propertyId);
    const guests = await guestStatusService.getCheckInOutPendingGuests(
      propertyId,
      filtersResult.data,
    );

    return responseHandler(res, { guests: guests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getGuestById = async (req, res, next) => {
  try {
    const guestId = req.params.guestId;
    const guest = await guestService.find({
      _id: guestId,
    });
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    return responseHandler(res, {
      guest: { ...guest._doc, status: guestStatus },
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

// get display data -> preaarival ,addons , getguestbyid
// new api edit -> patch ->guestedit ->
// add in routes getguestdisplay, guestedit

// Get combined guest data from PreArrival, AddOns, and Guest by ID

/**
 * Get combined guest data from PreArrival, AddOns, and Guest by ID
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getGuestData = async (req, res, next) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;

    // Fetch data from all services
    const guestData = await guestService.getByGuestId(guestId); // Fetch Guest Information
    const preArrivalData = await preArrivalService.getByGuestId(guestId); // Fetch Pre-arrival data
    const addOnsData = await addOnsServices.findAllByGuestId(
      propertyId,
      guestId,
    ); // Fetch Add-ons data
    const guestStatus = await guestStatusService.getByGuestId(guestId); // Fetch Guest Status
    const checkInOutRequest =
      await checkInOutRequestService.getByPropertyIdAndGuestId(
        propertyId,
        guestId,
      );

    // Combine all data into a single response
    const combinedData = {
      guest: guestData,
      status: guestStatus,
      preArrival: preArrivalData,
      addOns: addOnsData,
      checkInOutRequest: checkInOutRequest,
    };

    return responseHandler(res, combinedData);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 *  * Update guest data: Allows editing of guest fields
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const guestedit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { guestId, propertyId } = req.params;
    const { guest, status, preArrival } = req.body;
    console.log("q", guest);
    let updatedGuest = null,
      updatedPreArrival = null,
      statusResult = null;
    // updatedAddOns = null,
    // updatedCheckInOutRequest = null;
    if (guest) {
      const guestResult =
        await UpdateGuestValidationSchema.safeParseAsync(guest);
      if (!guestResult.success) {
        throw new ValidationError(
          "Invalid guest data",
          guestResult.error.flatten().fieldErrors,
        );
      }

      updatedGuest = await guestService.update(
        guest,
        propertyId,
        guestId,
        session,
      );
      if (!updatedGuest || updatedGuest.modifiedCount === 0) {
        throw new Error("Failed to update guest");
      }
    }
    if (status) {
      statusResult =
        await UpdateGuestStatusValidationSchema.safeParseAsync(status);
    }

    // Conditionally update pre-arrival information if provided
    if (preArrival) {
      preArrival.guestId = guestId;
      preArrival.propertyId = propertyId;
      updatedPreArrival = await preArrivalService.update(
        guestId,
        preArrival,
        session,
      );
      if (!updatedPreArrival || updatedPreArrival.modifiedCount === 0) {
        throw new Error("Failed to update pre-arrival");
      }
    }

    //  Conditionally update add-ons if provided
    // if (addOns && addOns.addOnsRequests.length > 0) {
    //   updatedAddOns = await addOnsServices.updateAllByGuestId(
    //     propertyId,
    //     guestId,
    //     addOns.addOnsRequests,
    //     session,
    //   );
    //   if (!updatedAddOns || updatedAddOns.modifiedCount === 0) {
    //     throw new Error("Failed to update add-ons");
    //   }
    // }

    //  Conditionally update check-in/out request if provided
    // if (checkInOutRequest && Object.keys(checkInOutRequest).length > 0) {
    //   updatedCheckInOutRequest =
    //     await checkInOutRequestService.updateFieldByPropertyIdAndGuestId(
    //       propertyId,
    //       guestId,
    //       checkInOutRequest,
    //       session,
    //     );
    //   // if (
    //   //   !updatedCheckInOutRequest ||
    //   //   updatedCheckInOutRequest.modifiedCount === 0
    //   // ) {
    //   //   throw new Error("Failed to update check-in/out request");
    //   // }
    // }

    // Commit the transaction if all updates succeed
    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: updatedGuest },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest messages updated
    //req.app.io.to(`guest:${guestId}`).emit("message:newMessage", {});

    // Return response with all updated data, including those that were not updated
    return responseHandler(res, {
      updatedGuest,
      updatedPreArrival,
      updatedGuestStatus,
      // updatedAddOns,
      // updatedCheckInOutRequest,
    });
  } catch (e) {
    // Rollback the transaction on error
    await session.abortTransaction();
    session.endSession();

    console.log("Error occurred during transaction:", e.message); // Log error details

    // Handle specific API errors if necessary
    if (e instanceof APIError) {
      return next(e);
    }
    // General server error
    return next(new InternalServerError("Transaction failed"));
  }
};

const getGuestAddonsRequests = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const { requestStatus } = req.query;
    const { requests, propertyAddons } =
      await guestService.getGuestAddonsRequests(propertyId, requestStatus);
    return responseHandler(res, {
      requests,
      propertyAddons,
    });
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};
const sendOtp = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const guest = req.body;
    const guestResult = GuestSelfRegistrationValidationSchema.safeParse(guest);
    const existingGuest = await guestService.getGuestByPhoneNumber(
      propertyId,
      guest.countryCode,
      guest.phoneNumber,
    );

    console.log("Existing Guest", existingGuest);
    if (existingGuest) {
      const existingGuestSession = await guestSessionService.findOne({
        propertyId,
        guestId: existingGuest._id,
      });
      return responseHandler(res, {
        guestSessionId: existingGuestSession._id,
      });
    }
    console.log(guestResult);
    if (!guestResult.success) {
      throw new ValidationError("Validation Error", {
        ...guestResult.error.flatten().fieldErrors,
      });
    }
    let twilioAccount = await twilioAccountService.getByPropertyId(propertyId);
    const twilioClient = await twilioService.getTwilioClient(twilioAccount);
    if (!twilioAccount) {
      throw new NotFoundError("Twilio account not found", {
        propertyId: ["Twilio account not found for this property"],
      });
    }
    if (!guest.phoneNumber || !guest.countryCode) {
      throw new ValidationError("Phone number is required", {
        phoneNumber: ["Phone number is required"],
      });
    }
    const property = await propertyService.find({ _id: propertyId });
    console.log("Property name", property.name);

    if (!twilioAccount.verificationSid) {
      const verificationService = await twilioClient.verify.v2.services.create({
        friendlyName: property.name.trim(),
      });
      twilioAccount = await twilioAccountService.update(propertyId, {
        verificationServiceSid: verificationService.sid,
      });
      console.log(twilioAccount);
    }
    console.log(twilioAccount.verificationServiceSid);
    const verification = await twilioClient.verify.v2
      .services(twilioAccount.verificationServiceSid)
      .verifications.create({
        channel: "sms",
        to: `${guest.countryCode}${guest.phoneNumber}`,
      });
    console.log(verification);
    return responseHandler(res, {});
  } catch (e) {
    console.log(e);
    console.log("e.code = ", e.code);
    if (e.code === 60200) {
      return next(
        new ValidationError("Invalid phone number", {
          phoneNumber: ["Invalid phone number"],
        }),
      );
    }
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    return responseHandler(res, {});
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next Function
 */
const guestSelfRegistration = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // TODO: add messageGuest
    const guest = req.body;
    const { propertyId } = req.params;
    const twilioAccount =
      await twilioAccountService.getByPropertyId(propertyId);
    const twilioClient = await twilioService.getTwilioClient(twilioAccount);
    if (guest.countryCode !== "+86") {
      const verification = await twilioClient.verify.v2
        .services(twilioAccount.verificationServiceSid)
        .verificationChecks.create({
          to: `${guest.countryCode}${guest.phoneNumber}`,
          code: guest.otp,
        });
      if (verification.status !== "approved") {
        throw new ValidationError("Invalid OTP", {
          otp: ["Invalid OTP"],
        });
      }
    }

    const guestResult = GuestSelfRegistrationValidationSchema.safeParse(guest);
    console.log(guestResult);
    if (!guestResult.success) {
      throw new ValidationError("Validation Error", {
        ...guestResult.error.flatten().fieldErrors,
      });
    }

    // const existingInHouseGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guest.phoneNumber,
    //     countryCode: guest.countryCode,
    //     propertyId: propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // if (existingInHouseGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }
    // const existingReservedGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guest.phoneNumber,
    //     countryCode: guest.countryCode,
    //     propertyId: propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.RESERVED,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // if (existingReservedGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }

    // Check if status is valid
    //if (!validateStatus(status)) {
    //  throw new ValidationError("Invalid Status", {
    //		currentStatus: "Invalid Status",
    //	});
    //}

    // Create guest
    const newGuest = await guestService.create(guest, propertyId, session);

    // Create guest status
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      {
        currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
        reservationStatus: RESERVATION_STATUS.CONFIRMED,
      },
      session,
    );
    // Create Guest Session
    const guestSession = await guestSessionService.create(
      propertyId,
      newGuest._id,
      session,
    );
    // Create chat list
    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );

    // todo: move to sms.service
    // Send message to the guest
    const { property } = await propertyService.getById(propertyId);
    // const message = `Welcome to ${property.name}.\nYour guest portal link is: ${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`;
    // await twilioService.sendAccessLink(
    //   propertyId,
    //   `${newGuest.countryCode + newGuest.phoneNumber}`,
    //   message,
    // );
    // TODO: Workflow message trigger
    // if (sendMessage === true) {
    // }
    //await session.commitTransaction();
    //session.startTransaction();

    // Send message to the guest according to the status
    if (guest.phoneNumber && guest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(newGuestStatus),
        );
      if (messageTemplate) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);
        const propertySetting = await settingService.getByPropertyId(
          property._id,
        );
        const updatedMessageBody = modifyMessageTemplateBody(
          messageTemplate,
          newGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${newGuest.countryCode}${newGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );
        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: newGuest._id,
            senderId: propertyId,
            receiverId: newGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );
        const updatedChatList =
          await chatListService.updateAndIncUnreadMessages(
            propertyId,
            newGuest._id,
            {
              latestMessage: newMessage._id,
            },
            session,
            0,
          );
      }
    }
    await session.commitTransaction();
    session.endSession();

    // Trigger events
    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: chatList,
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${newGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    return responseHandler(
      res,
      {
        guest: {
          ...newGuest._doc,
          status: { ...newGuestStatus._doc },
          guestSessionId: guestSession._id,
        },
      },
      201,
      "Guest Created",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const deleteAddOnsRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId, requestId } = req.params;
    const { requestType } = req.query;
    if (
      requestType === "extendStay" ||
      requestType === "earlyCheckIn" ||
      requestType === "lateCheckOut"
    ) {
      const deletedCheckInOutRequest =
        await checkInOutRequestService.deleteCheckInOutRequest(
          propertyId,
          guestId,
          requestId,
          session,
        );
    } else if (requestType === "addOns") {
      const deletedAddOnsRequest =
        await addOnsRequestService.deleteAddOnsRequest(
          propertyId,
          guestId,
          requestId,
          session,
        );
    } else {
      throw new NotFoundError("Addon type not found", {
        addonType: requestType,
      });
    }
    req.app.io.to(`property:${propertyId}`).emit("request:update", {});
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { message: "Successfully deleted" });
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getCheckInOutPendingGuests,
  getGuestById,
  getGuestData,
  guestedit,
  getGuestAddonsRequests,
  guestSelfRegistration,
  sendOtp,
  deleteAddOnsRequest,
};
