const { default: mongoose } = require("mongoose");
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
const {
  modifyMessageTemplateBody,
} = require("../utils/messageTemplateUpdate");

const logger = require("../configs/winston.config");

const { responseHandler } = require("../middlewares/response.middleware");
const {
  ValidationError,
} = require("../lib/CustomErrors");

const {
  guestStatusToTemplateOnCreate,
} = require("../utils/guestStatustToTemplate");
const {
  GUEST_CURRENT_STATUS,
} = require("../constants/guestStatus.contant");
const { countries } = require("../data/countries+iso2+code.json");
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
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });

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
      roomNumber: reservation.booking_status === 'CHECKED_IN' ? reservation.room_number : undefined,
      source: reservation.source,
      confirmationNumber: reservation.reservation_no,
      checkIn: new Date(reservation.check_in_date),
      checkOut: new Date(reservation.check_out_date),
      pmsId: reservation.id,
    };

    // Create new guest
    const newGuest = await guestService.upsert(reservation.id, guestData, propertyId, { session });

    // Create guest status
    const guestStatusData = {
      guestId: newGuest._id,
      propertyId,
      currentStatus: mapBookingStatusToGuestStatus(reservation.booking_status),
    };

    const guestStatus = await guestStatusService.create(guestStatusData, { session });
    const chatList = await chatListService.create(
      propertyId,
      newGuest._id,
      session,
    );


    if ( newGuest.phoneNumber && newGuest.countryCode) {
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
          `${process.env.MOBILE_FRONTEND_URL}/${newGuest._id}`,
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

    return responseHandler(
      res,
      { guest: { ...newGuest._doc, status: { ...guestStatus._doc } } },
      201,
      "Reservation Created",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const updateReservationGuest = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    const { guest_info } = reservation;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
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
        pmsId: reservation.id,
      },
      { session },
    );

    if ( updatedGuest.phoneNumber && updatedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          'Guest Data Update'
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

const updateReservationStatus = async (folio,propertyId,req) => {
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
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
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
    if(reservation.booking_status === 'CHECKED_IN'){
      const updatedGuest = await guestService.update(
        guestId,
        {
          roomNumber: reservation.room_number,
        },
        { session },
      );
    }

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
          upsertedGuest,
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
    return responseHandler(
      res,
      { guest: { ...existingGuest._doc, status: { ...updatedGuestStatus._doc } } },
      200,
      "Reservation Status Updated",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

const reservationCheckedIn = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    if(!reservation.booking_status === 'CHECKED_IN'){
      throw new ValidationError("Reservation not checked in", {
        reservationId: ["Reservation not checked in"],
      });
    }
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
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
    if(existingGuest.phoneNumber && existingGuest.countryCode){
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
    return responseHandler(
      res,
      { guest: { ...existingGuest._doc, status: { ...updatedGuestStatus._doc } } },
      200,
      "Reservation Checked In",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
}

const reservationCheckedOut = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservation } = folio;
    if(!reservation.booking_status === 'CHECKED_OUT'){
      throw new ValidationError("Reservation not checked out", {
        reservationId: ["Reservation not checked out"],
      });
    }
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
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
    if(existingGuest.phoneNumber && existingGuest.countryCode){
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
    return responseHandler(
      res,
      { guest: { ...existingGuest._doc, status: { ...updatedGuestStatus._doc } } },
      200,
      "Reservation Checked Out",
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("HotelKey Reservation Error:", error);
    throw error;
  } finally {
    session.endSession();
  }
}



const additionalGuestDataChanged = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation, additional_guest_info } = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });
    if (!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const countryCode = additional_guest_info.country
      ? countries.find(
          (c) => c.iso2.toLowerCase() === additional_guest_info.country.toLowerCase(),
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
    if ( updatedGuest.phoneNumber && updatedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          'Guest Data Update',
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
}

const arrivalTimeChanged = async (folio, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
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
    if(existingGuest.phoneNumber && existingGuest.countryCode){
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          'Check In Time Update',
        );
        if(messageTemplate){
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
}

const departureTimeChanged = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });
    if(!existingGuest) {
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
    if(existingGuest.phoneNumber && existingGuest.countryCode){
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          'Check Out Time Update',
        );
        if(messageTemplate){
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
}

const checkOutDateChanged = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });
    if(!existingGuest) {
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
    if(existingGuest.phoneNumber && existingGuest.countryCode){
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          'Check Out Time Update',
        );
        if(messageTemplate){
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
}

const roomNumberChanged = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {reservation} = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });
    if(!existingGuest) {
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
}


const reservationCancelled = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reservation } = folio;
    const existingGuest = await guestService.findOne({
      propertyId,
      pmsId: reservation.id,
    });
    if(!existingGuest) {
      throw new ValidationError("Guest not found", {
        reservationId: ["Reservation not found"],
      });
    }
    const existingGuestStatus = await guestStatusService.find({
      guestId: existingGuest._id,
      propertyId,
    });
    if(!existingGuestStatus) {
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
}

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
//     const existingGuest = await guestService.findOne({
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

/**
 * Maps HotelKey booking status to guest status
 * @param {string} bookingStatus
 * @returns {string}
 */
const mapBookingStatusToGuestStatus = (bookingStatus) => {
  const statusMap = {
    CHECKED_IN: GUEST_CURRENT_STATUS.IN_HOUSE,
    CHECKED_OUT: GUEST_CURRENT_STATUS.CHECKED_OUT,
    //'CANCELLED': GUEST_CURRENT_STATUS.CANCELLED,
    RESERVED: GUEST_CURRENT_STATUS.RESERVED,
    //'NO_SHOW': GUEST_CURRENT_STATUS.NO_SHOW,
  };
  return statusMap[bookingStatus] || GUEST_CURRENT_STATUS.RESERVED;
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
};
