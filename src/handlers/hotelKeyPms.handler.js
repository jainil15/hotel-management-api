const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const {
  messageType,
  messageTriggerType,
} = require("../constants/message.constant");
const messageTemplateService = require("../services/messageTemplate.service");
const messageService = require("../services/message.service");
const smsService = require("../services/sms.service");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const settingService = require("../services/setting.service");
const twilioService = require("../services/twilio.service");
const twilioAccountService = require("../services/twilioAccount.service");
const chatListService = require("../services/chatList.service");
const propertyService = require("../services/property.service");
const houseKeepingRequestService = require("../services/houseKeepingRequest.service");
const guestSessionService = require("../services/guestSession.service");
const { modifyMessageTemplateBody } = require("../utils/messageTemplateUpdate");
const {
  sendSmsOnNewPhoneNumber,
  sendSmsOnPhoneNumberChange,
  sendSmsOnCheckInOrCheckOutTimeChange,
} = require("../handlers/apiPms.handler");

const logger = require("../configs/winston.config");

const { responseHandler } = require("../middlewares/response.middleware");
const { ValidationError, NotFoundError } = require("../lib/CustomErrors");

const {
  guestStatusToTemplateOnCreate,
  guestStatusToTemplateOnUpdate,
} = require("../utils/guestStatustToTemplate");
const {
  GUEST_CURRENT_STATUS,
  REQUEST_STATUS,
  RESERVATION_STATUS,
} = require("../constants/guestStatus.contant");
const { countries } = require("../data/countries+iso2+code.json");
const {
  ROOM_STATUS_CODE,
  WEBHOOK_ROOM_STATUS_CODE,
} = require("../constants/hotelKey.constant");
require("dotenv").config();

/**
 * @description Create a new booking
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @returns {object} - guest
 * @throws {Error} - Error
 */
const createReservation = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    const { guest_info } = reservation;
    //const pmsPropertyId = folio.property_id;
    if (!propertyId) {
      throw new ValidationError("Invalid PMS ID", {
        propertyId: ["Not connected to any PMS"],
      });
    }

    // Check if property exists
    const property = await propertyService.getById(propertyId);
    if (!property) {
      throw new ValidationError("Invalid property", {
        propertyId: ["Property not found"],
      });
    }

    // Check if guest already exists
    const existingGuest = await guestService.getByGuestPmsId(
      new ObjectId(propertyId),
      reservation.guest_info.guest_id,
    );

    if (existingGuest) {
      throw new ValidationError("Duplicate reservation", {
        reservationId: ["Reservation already exists"],
      });
    }

    // Get country dial code from ISO2 code
    const countryCode = guest_info.country
      ? countries.find(
          (c) => c.iso2.toLowerCase() === guest_info.country.toLowerCase(),
        )?.dialCode || "+1"
      : "+1";

    // Prepare guest data
    const guestData = {
      propertyId,
      firstName: guest_info.first_name,
      lastName: guest_info.last_name,
      email: guest_info.email,
      phoneNumber: guest_info.phone,
      countryCode: countryCode,
      roomNumber:
        reservation.booking_status === "CHECKED_IN"
          ? reservation.room_number
          : undefined,
      source: reservation.source,
      confirmationNumber: reservation.reservation_no,
      checkIn: new Date(reservation.check_in_date),
      checkOut: new Date(reservation.check_out_date),
      pmsId: reservation.guest_info.guest_id,
    };

    // Create new guest
    const newGuest = await guestService.upsert(
      reservation.guest_info.guest_id,
      guestData,
      propertyId,
      session,
    );

    // Create guest status
    const guestStatusData = {
      guestId: newGuest._id,
      propertyId,
      currentStatus: mapBookingStatusToGuestStatus(reservation.booking_status),
    };

    const guestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      {
        currentStatus: mapBookingStatusToGuestStatus(
          reservation.booking_status,
        ),
      },
      session,
    );

    const guestSession = await guestSessionService.create(
      propertyId,
      newGuest._id,
      session,
    );

    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );

    if (newGuest.phoneNumber && newGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(guestStatus),
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

    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...guestStatus._doc } },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {
      chatList: chatList,
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${newGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    await session.commitTransaction();
    return newGuest;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const updateReservationGuest = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    const { guest_info } = reservation;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const countryCode = guest_info.country
      ? countries.find(
          (c) => c.iso2.toLowerCase() === guest_info.country.toLowerCase(),
        )?.dialCode || "+1"
      : "+1";

    const property = await propertyService.getById(propertyId);
    if (!property) {
      throw new ValidationError("Invalid property", {
        propertyId: ["Property not found"],
      });
    }

    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        firstName: guest_info.first_name,
        lastName: guest_info.last_name,
        email: guest_info.email,
        phoneNumber: guest_info.phone,
        countryCode: countryCode,
        checkIn: new Date(reservation.check_in_date),
        checkOut: new Date(reservation.check_out_date),
        roomNumber: reservation.room_number,
        source: reservation.source,
        confirmationNumber: reservation.reservation_no,
        pmsId: reservation.guest_info.guest_id,
      },
      { session },
    );

    if (updatedGuest.phoneNumber && updatedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          "Guest Data Update",
        );
      //const message = `Dear ${updatedGuest.firstName} ${updatedGuest.lastName}, We wanted to inform you that your data has been successfully updated in our system. If you did not request this change, please contact the front desk immediately for assistance. Thank you for choosing Onelyk. Warm regards, Team Onelyk`;
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
          updatedGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${updatedGuest._id}`,
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
        const updatedChatList =
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
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc },
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("chatList:update", {});
    await session.commitTransaction();
    return updatedGuest;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const updateReservationStatus = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    //const pmsPropertyId = folio.property_id;
    if (!propertyId) {
      throw new ValidationError("Invalid PMS ID", {
        propertyId: ["Not connected to any PMS"],
      });
    }
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const guestId = existingGuest._id;
    const guestStatus = await guestStatusService.findOne({
      guestId,
      propertyId,
    });
    if (!guestStatus) {
      throw new ValidationError("Guest status not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuestStatus = await guestStatusService.upsert(
      propertyId,
      guestId,
      {
        currentStatus: mapBookingStatusToGuestStatus(
          reservation.booking_status,
        ),
      },
      { session },
    );
    if (reservation.booking_status === "CHECKED_IN") {
      const updatedGuest = await guestService.update(
        guestId,
        {
          roomNumber: reservation.room_number,
        },
        { session },
      );
    }
    const { property } = await propertyService.getById(propertyId);

    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(updatedGuestStatus),
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
          existingGuest,
          property,
          propertySetting,
          `${process.env.MOBILE_FRONTEND_URL}/${upsertedGuest._id}`,
        );
        const sentMessage = await smsService.send(
          twilioSubClient,
          `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
          `${upsertedGuest.countryCode}${upsertedGuest.phoneNumber}`,
          `${updatedMessageBody.message}`,
        );
        const newMessage = await messageService.create(
          {
            propertyId: propertyId,
            guestId: upsertedGuest._id,
            senderId: propertyId,
            receiverId: upsertedGuest._id,
            content: sentMessage.body,
            messageSid: sentMessage.sid,
            messageType: messageType.SMS,
            messageTriggerType: messageTriggerType.AUTOMATIC,
            status: sentMessage.status,
          },
          session,
        );
      }
      // Emit to chat list updated
    }
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: {
        ...existingGuest._doc,
        status: { ...updatedGuestStatus._doc },
      },
    });

    // Emit to guest messages updated
    req.app.io.to(`guest:${existingGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    await session.commitTransaction();
    return updatedGuestStatus;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const reservationCheckedIn = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    if (!reservation.booking_status === "CHECKED_IN") {
      throw new ValidationError("Reservation not checked in", {
        reservationId: ["Reservation not checked in"],
      });
    }
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        roomNumber: reservation.room_number,
      },
      { session },
    );
    const updatedGuestStatus = await guestStatusService.update(
      existingGuest._id,
      {
        currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
      },
      { session },
    );
    const property = await propertyService.getById(propertyId);
    if (!property) {
      throw new ValidationError("Invalid property", {
        propertyId: ["Property not found"],
      });
    }
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(updatedGuestStatus),
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
        const updatedChatList =
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
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: {
        ...existingGuest._doc,
        status: { ...updatedGuestStatus._doc },
      },
    });

    // Emit to guest messages updated
    req.app.io.to(`guest:${existingGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    await session.commitTransaction();
    return updatedGuest;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const reservationCheckedOut = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    if (!reservation.booking_status === "CHECKED_OUT") {
      throw new ValidationError("Reservation not checked out", {
        reservationId: ["Reservation not checked out"],
      });
    }
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuestStatus = await guestStatusService.update(
      existingGuest._id,
      {
        currentStatus: GUEST_CURRENT_STATUS.CHECKED_OUT,
      },
      { session },
    );
    const property = await propertyService.getById(propertyId);
    if (!property) {
      throw new ValidationError("Invalid property", {
        propertyId: ["Property not found"],
      });
    }
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(updatedGuestStatus),
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
        const updatedChatList =
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
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: {
        ...existingGuest._doc,
        status: { ...updatedGuestStatus._doc },
      },
    });

    // Emit to guest messages updated
    req.app.io.to(`guest:${existingGuest._id}`).emit("message:newMessage", {
      message: {},
    });

    await session.commitTransaction();
    return updatedGuest;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const additionalGuestDataChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation, additional_guest_info } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const countryCode = additional_guest_info.country
      ? countries.find(
          (c) =>
            c.iso2.toLowerCase() ===
            additional_guest_info.country.toLowerCase(),
        )?.dialCode || "+1"
      : "+1";
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        firstName: additional_guest_info.first_name,
        lastName: additional_guest_info.last_name,
        email: additional_guest_info.email,
        phoneNumber: additional_guest_info.phone,
        countryCode: countryCode,
      },
      { session },
    );
    const property = await propertyService.getById(propertyId);
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    if (updatedGuest.phoneNumber && updatedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          "Guest Data Update",
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
        const updatedChatList =
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
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc },
    });
    // Emit to guest messages updated
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("chatList:update", {});
    await session.commitTransaction();
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc } },
      200,
      "Reservation Updated",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const arrivalTimeChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        checkIn: new Date(reservation.check_in_date),
      },
      { session },
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    const property = await propertyService.getById(propertyId);
    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          "Check In Time Update",
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
        const updatedChatList =
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
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc },
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("chatList:update", {});

    await session.commitTransaction();
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc } },
      200,
      "Check In Time Updated",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const departureTimeChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        checkOut: new Date(reservation.check_out_date),
      },
      { session },
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    const property = await propertyService.getById(propertyId);
    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          "Check Out Time Update",
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
        const updatedChatList =
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
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc },
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("chatList:update", {});

    await session.commitTransaction();
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc } },
      200,
      "Departure Time Updated",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const checkOutDateChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        checkOut: new Date(reservation.check_out_date),
      },
      { session },
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      existingGuest._id,
    );
    const property = await propertyService.getById(propertyId);
    if (existingGuest.phoneNumber && existingGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          "Check Out Time Update",
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
        const updatedChatList =
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
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc },
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("chatList:update", {});

    await session.commitTransaction();
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc } },
      200,
      "Check Out Date Updated",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const roomNumberChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuest = await guestService.update(
      existingGuest._id,
      {
        roomNumber: new Date(reservation.room_number),
      },
      { session },
    );
    await session.commitTransaction();
    return updatedGuest;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const reservationCancelled = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.getByGuestPmsId({
      propertyId,
      pmsId: reservation.guest_info.guest_id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const existingGuestStatus = await guestStatusService.find({
      guestId: existingGuest._id,
      propertyId,
    });
    if (!existingGuestStatus) {
      throw new ValidationError("Guest status not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const updatedGuestStatus = await guestStatusService.update(
      existingGuestStatus._id,
      {
        currentStatus: "Cancelled",
      },
      { session },
    );
    await session.commitTransaction();
    return updatedGuestStatus;
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

// const checkOutDateExtended = async (folio,propertyId,req) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { reservation } = folio;
//     if(!reservation.booking_status === 'CHECKED_OUT'){
//       throw new ValidationError("Reservation not checked out", {
//         reservationId: ["Reservation not checked out"],
//       });
//     }
//     const existingGuest = await guestService.getByGuestPmsId({
//       propertyId,
//       pmsId: reservation.id,
//     });
//     if (!existingGuest) {
//       throw new ValidationError("Guest not found", {
//         reservationId: ["Reservation not found"],
//       });
//     }
//     const updatedGuestStatus = await guestStatusService.update(
//       existingGuest._id,
//       {
//         currentStatus: GUEST_CURRENT_STATUS.CHECKED_OUT,
//       },
//       { session },
//     );
//     await session.commitTransaction();
//     return updatedGuestStatus;
//   } catch (error) {
//     await session.abortTransaction();
//     logger.error("HotelKey Reservation Error:", error);
//     throw error;
//   } finally {
//     session.endSession();
//   }

// }

const houseKeepingUpdate = async (houseKeepingData, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existingGuest = await guestService.findGuestByGuestStatus(
      propertyId,
      {
        roomNumber: houseKeepingData.room,
      },
      GUEST_CURRENT_STATUS.IN_HOUSE,
    );
    if (!existingGuest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given room number"],
      });
    }
    const houseKeepingRequest = await houseKeepingRequestService.find({
      propertyId,
      guestId: existingGuest._id,
      requestStatus: REQUEST_STATUS.REQUESTED,
    });
    if (houseKeepingRequest.length <= 0) {
      throw new NotFoundError("Housekeeping request not found", {
        requestId: ["Housekeeping request not found for the given guest"],
      });
    }
    const houseKeepingStatus = houseKeepingData.action;
    if (houseKeepingStatus === WEBHOOK_ROOM_STATUS_CODE.MARK_CLEAN) {
      const updatedHouseKeepingRequest =
        await houseKeepingRequestService.update(
          houseKeepingRequests[0]._id,
          {
            requestStatus: REQUEST_STATUS.COMPLETED,
          },
          session,
        );
      const { message, chatList } = await sendSmsAddOnsCompleted(
        propertyId,
        existingGuest,
        session,
      );
      req.app.io
        .to(`property:${updatedHouseKeepingRequest.propertyId}`)
        .emit("request:update", {});
      req.app.io
        .to(`guest:${updatedHouseKeepingRequest.guestId}`)
        .emit("message:newMessage", { message });
      req.app.io
        .to(`property:${updatedHouseKeepingRequest.propertyId}`)
        .emit("chatList:update", { chatList });
    }
    req.app.io
      .to(`property:${existingGuest.propertyId}`)
      .emit("addOn:newAddon", {
        count: 1,
      });
    await session.commitTransaction();
    session.endSession();
    return roomStatus;
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * Maps HotelKey booking status to guest status
 * @param {string} bookingStatus
 * @returns {string}
 */
const mapBookingStatusToGuestStatus = (bookingStatus) => {
  const statusMap = {
    CHECKED_IN: GUEST_CURRENT_STATUS.IN_HOUSE,
    CHECKED_OUT: GUEST_CURRENT_STATUS.CHECKED_OUT,
    CANCELLED: GUEST_CURRENT_STATUS.RESERVED,
    BOOKED: GUEST_CURRENT_STATUS.RESERVED,
    NO_SHOW: GUEST_CURRENT_STATUS.RESERVED,
  };
  return statusMap[bookingStatus] || GUEST_CURRENT_STATUS.RESERVED;
};

const sendSmsAddOnsCompleted = async (propertyId, guest, session) => {
  const twilioAccount = await twilioAccountService.getByPropertyId(propertyId);
  const twilioSubClient = await twilioService.getTwilioClient(twilioAccount);
  const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
    propertyId,
    "AddOns Completed",
  );
  if (messageTemplate) {
    const propertySetting = await settingService.getByPropertyId(propertyId);
    const { property } = await propertyService.getById(propertyId);
    const updatedMessageBody = modifyAddOnsMessageTemplateBody(
      messageTemplate,
      property,
      guest,
      { name: "House Keeping" },
      "",
    );
    const sentSms = await smsService.send(
      twilioSubClient,
      `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
      `${guest.countryCode}${guest.phoneNumber}`,
      `${updatedMessageBody.message}`,
    );
    const newMessage = await messageService.create(
      {
        propertyId: propertyId,
        guestId: guest._id,
        senderId: propertyId,
        receiverId: guest._id,
        content: updatedMessageBody.message,
        messageSid: sentSms.sid,
        messageType: messageType.SMS,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        status: "sent",
      },
      session,
    );
    const updatedChatList = await chatListService.updateAndIncUnreadMessages(
      propertyId,
      guest._id,
      {
        latestMessage: newMessage._id,
      },
      session,
    );
    return { message: newMessage, chatList: updatedChatList };
  }
  return { message: null, chatList: null };
};

const handleCreateGuest = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const guestDetails = getGuestDetails(folio, propertyId);
    const guestStatusDetails = getGuestStatusDetails(folio, propertyId);
    const newGuest = await guestService.create(
      guestDetails,
      propertyId,
      session,
    );
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      guestStatusDetails,
      session,
    );
    const guestSession = await guestSessionService.create(
      propertyId,
      newGuest._id,
      session,
    );
    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );
    if (newGuest.countryCode && newGuest.phoneNumber) {
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
        const { property } = await propertyService.getById(propertyId);
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
          );
      }
    }
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: newGuestStatus },
    });
    req.app.io.to(`guest:${newGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`guest:${newGuest._id}`).emit("chatList:update", {
      chatList: { ...chatList._doc },
    });
    await session.commitTransaction();
    return { guest: { ...newGuest._doc, status: newGuestStatus } };
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Creation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};
const handleUpdateGuest = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const guestDetails = getGuestDetails(folio, propertyId);
    const guestStatusDetails = getGuestStatusDetails(folio, propertyId);
    console.log("Guest Details:", guestStatusDetails);
    const existingGuest = await guestService.getByGuestPmsId(
      propertyId,
      reservation.guest_info.guest_id,
    );
    console.log(existingGuest);
    const { property } = await propertyService.getById(propertyId);
    if (!existingGuest) {
      return handleCreateGuest(folio, propertyId, req);
    }
    const updatedGuest = await guestService.update(
      guestDetails,
      propertyId,
      existingGuest._id,
      session,
    );
    const existingGuestStatus = await guestStatusService.getByGuestId(
      existingGuest._id,
    );
    const updatedGuestStatus = await guestStatusService.update(
      existingGuest._id,
      guestStatusDetails,
      session,
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      updatedGuest._id,
    );
    if (!guestSession) {
      throw new ValidationError("Guest session not found", {
        guestId: ["Guest session not found for the given guest"],
      });
    }
    await sendSmsOnNewPhoneNumber(
      existingGuest,
      updatedGuest,
      existingGuestStatus,
      session,
    );
    await sendSmsOnPhoneNumberChange(existingGuest, updatedGuest, session);
    await sendSmsOnCheckInOrCheckOutTimeChange(
      existingGuest,
      updatedGuest,
      session,
    );
    if (updatedGuest.countryCode && updatedGuest.phoneNumber) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(
            existingGuestStatus,
            updatedGuestStatus,
          ),
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
        const updatedChatList =
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
    return { guest: { ...updatedGuest._doc, status: updatedGuestStatus } };
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Update Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const getGuestDetails = (folio, propertyId) => {
  const { reservation } = folio;
  const guestDetails = {
    firstName: reservation.guest_info.first_name,
    lastName: reservation.guest_info.last_name,
    email: reservation.guest_info.email,
    phoneNumber: reservation.guest_info.phone,
    countryCode: reservation.guest_info.country
      ? countries.find(
          (c) =>
            c.iso2.toLowerCase() ===
            reservation.guest_info.country.toLowerCase(),
        )?.dialCode || "+1"
      : "+1",
    pmsId: reservation.guest_info.guest_id,
    source: reservation.source_detail.name,
    checkIn: new Date(reservation.check_in_date),
    checkOut: new Date(reservation.check_out_date),
    roomNumber: reservation.room_number,
    active: true,
  };
  return guestDetails;
};

const mapReservationStatus = (bookingStatus) => {
  const bookingToReservationStatus = {
    CANCELLED: RESERVATION_STATUS.CANCELLED,
    NO_SHOW: RESERVATION_STATUS.NO_SHOW,
  };
  if (bookingToReservationStatus[bookingStatus]) {
    return bookingToReservationStatus[bookingStatus];
  }
  return RESERVATION_STATUS.CONFIRMED;
};
const getGuestStatusDetails = (folio, propertyId) => {
  const { reservation } = folio;
  const { booking_status: bookingStatus } = reservation;
  const guestStatusDetails = {
    currentStatus: mapBookingStatusToGuestStatus(bookingStatus),
    reservationStatus: mapReservationStatus(bookingStatus),
  };
  return guestStatusDetails;
};
module.exports = {
  createReservation,
  updateReservationGuest,
  updateReservationStatus,
  reservationCheckedIn,
  reservationCheckedOut,
  reservationCancelled,
  //checkOutDateExtended,
  additionalGuestDataChanged,
  arrivalTimeChanged,
  departureTimeChanged,
  checkOutDateChanged,
  roomNumberChanged,
  houseKeepingUpdate,
  handleUpdateGuest,
  handleCreateGuest,
};
