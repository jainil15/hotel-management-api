const { default: mongoose } = require("mongoose");
const {
  CreateGuestValidationSchema,
  UpdateGuestValidationSchema,
} = require("../models/guest.model");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant");
const messageTemplateService = require("../services/messageTemplate.service");
const messageService = require("../services/message.service");
const smsService = require("../services/sms.service");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const guestTokenService = require("../services/guestToken.service");
const twilioService = require("../services/twilio.service");
const twilioAccountService = require("../services/twilioAccount.service");
const chatListService = require("../services/chatList.service");
const propertyService = require("../services/property.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
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
    console.log(guest.roomNumber);
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
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...statusResult?.error?.flatten().fieldErrors,
        ...sendMessageResult?.error?.flatten().fieldErrors,
        ...roomNumberResult?.error?.flatten().fieldErrors,
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
    if (existingInHouseGuest.length > 0) {
      console.log(existingInHouseGuest);
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
    if (existingReservedGuest.length > 0) {
      console.log(existingReservedGuest);
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

    // Create chat list
    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );

    // Password Less Login
    // get access token for guest login
    const accessToken = await guestTokenService.create(newGuest._id, session);
    // Get property
    const property = await propertyService.getById(propertyId);

    // TODO: Move to sms.service
    // Send message to the guest
    // const message = `Welcome to ${property.name}, Your guest portal link is: ${process.env.MOBILE_FRONTEND_URL}/login?token=${accessToken}`;
    // await twilioService.sendAccessLink(
    // 	propertyId,
    // 	`${newGuest.countryCode + newGuest.phoneNumber}`,
    // 	message,
    // );
    // TODO: Workflow message trigger
    // if (sendMessage === true) {
    // }
    //await session.commitTransaction();
    //session.startTransaction();

    // Send message to the guest according to the status
    if (sendMessage === true) {
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
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${newGuest.countryCode}${newGuest.phoneNumber}`,
          messageTemplate.message,
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
    const { sendMessage, status, ...guest } = req.body;
    const propertyId = req.params.propertyId;
    const guestId = req.params.guestId;
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

    const updatedGuest = await guestService.update(
      guest,
      propertyId,
      guestId,
      session,
    );
    const oldGuestStatus = await guestStatusService.getByGuestId(guestId);
    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session,
    );

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

    if (sendMessage === true) {
      // Get Message Template
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, updatedGuestStatus),
        );
      // Send Message

      if (messageTemplate) {
        const twilioAccount =
          await twilioAccountService.getByPropertyId(propertyId);
        if (!twilioAccount) {
          throw new NotFoundError("Twilio account not found", {
            propertyId: ["Twilio account not found for this property"],
          });
        }

        const twilioSubClient =
          await twilioService.getTwilioClient(twilioAccount);

        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
          messageTemplate.message,
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

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getGuestById,
};
