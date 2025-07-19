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
const { getCountryCode } = require("../utils/country.util");
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
const houseKeepingRequestService = require("../services/houseKeepingRequest.service");
const checkInOutRequestService = require("../services/checkInOutRequest.service");
const {
  modifyMessageTemplateBody,
  modifyMessageTemplateBodyForPhoneNumberChange,
  modifyAddOnsMessageTemplateBody,
  convertUTCToLocal,
  modifyCheckInOutMessageTemplateBody,
} = require("../utils/messageTemplateUpdate");
const countryFile = require("../data/country.json");
const countryFileFull = require("../data/country_full.json");
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
const {
  ROOM_STATUS_CODE,
  WEBHOOK_ROOM_STATUS_CODE,
} = require("../constants/asi.constant");
const { ADD_ONS_STATUS } = require("../constants/addOns.constant.js");
require("dotenv").config();

/**
 * Create a new booking
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @returns {object} - guest
 * @throws {Error} - Error
 */
const bookingCreate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      draft: true,
      pmsId: FolioInformation.Number,
    };
    if (number) {
      const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
        propertyId,
        number,
        country,
      );
      guestData.phoneNumber = phoneNumber;
      guestData.countryCode = countryCode;
    }
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };

    // Create guest
    // const newGuest = await guestService.create(guestData, propertyId, session);
    const newGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );

    // Create guest status
    // const newGuestStatus = await guestStatusService.create(
    //   propertyId,
    //   newGuest._id,
    //   guestStatusData,
    //   session,
    // );
    const newGuestStatus = await guestStatusService.upsert(
      propertyId,
      newGuest._id,
      guestStatusData,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } },
    });
    return { ...newGuest._doc, status: { ...newGuestStatus._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * Create a new booking
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {string} req - req
 * @returns {object} - guest
 * @throws {Error} - Error
 */
const bookingUpdate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      draft: true,
      pmsId: FolioInformation.Number,
    };
    if (number) {
      const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
        propertyId,
        number,
        country,
      );
      guestData.phoneNumber = phoneNumber;
      guestData.countryCode = countryCode;
    }
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    const guest = await guestService.getByGuestPmsId(propertyId, guestPmsId);
    // Update guest
    const updatedGuest = await guestService.update(
      guestData,
      propertyId,
      guest._id,
      session,
    );

    // Update guest status
    const updatedGuestStatus = await guestStatusService.update(
      updatedGuest._id,
      guestStatusData,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });
    return { ...updatedGuest._doc, status: { ...updatedGuest._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description Create a new booking
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {import('express').Request} req - Request
 * @returns {object} - guest
 * @throws {Error} - Error
 */
const bookingCancel = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      draft: true,
      pmsId: FolioInformation.Number,
    };
    if (number) {
      const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
        propertyId,
        number,
        country,
      );
      guestData.phoneNumber = phoneNumber;
      guestData.countryCode = countryCode;
    }
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CANCELLED,
    };
    const guest = await guestService.getByGuestPmsId(propertyId, guestPmsId);
    console.log(guest);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );
    const guestStatus = await guestStatusService.getByGuestId(guest._id);
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    console.log(guest._id);
    const updatedGuestStatus = await guestStatusService.update(
      guest._id,
      guestStatusData,
      session,
    );

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });
    return { ...guest._doc, status: { ...updatedGuestStatus._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

const bookingNoShow = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      draft: true,
      pmsId: FolioInformation.Number,
    };
    if (number) {
      const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
        propertyId,
        number,
        country,
      );
      guestData.phoneNumber = phoneNumber;
      guestData.countryCode = countryCode;
    }
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.NO_SHOW,
    };
    const guest = await guestService.getByGuestPmsId(propertyId, guestPmsId);
    console.log(guest);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );
    const guestStatus = await guestStatusService.getByGuestId(guest._id);
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    console.log(guest._id);
    const updatedGuestStatus = await guestStatusService.update(
      guest._id,
      guestStatusData,
      session,
    );

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });

    return { ...guest._doc, status: { ...updatedGuestStatus._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description Create a new reservation
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {import('express').Request} req - Request
 * @throws {Error} - Error
 */
const reservationCreate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    // Upsert guest
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );

    // Upsert guest status
    const upsertedGuestStatus = await guestStatusService.upsert(
      propertyId,
      upsertedGuest._id,
      guestStatusData,
      session,
    );
    // Create Guest Session
    const guestSession = await guestSessionService.upsert(
      propertyId,
      upsertedGuest._id,
      session,
    );
    // Create chat list
    const chatList = await chatListService.upsert(
      propertyId,
      upsertedGuest._id,
      session,
    );

    // Send message to the guest
    const { property } = await propertyService.getById(propertyId);

    // Send message to the guest according to the status
    if (upsertedGuest.phoneNumber && upsertedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(upsertedGuestStatus),
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
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
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
        const updatedChatList =
          await chatListService.updateAndIncUnreadMessages(
            propertyId,
            upsertedGuest._id,
            {
              latestMessage: newMessage._id,
            },
            session,
          );
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...upsertedGuestStatus._doc } },
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    // Emit to guest messages updated
    req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    return {
      ...upsertedGuest._doc,
      status: { ...upsertedGuestStatus._doc },
    };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 *  Create a new reservation
 * @param {object} folio - Folio object
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {import('express').Request} req - Request
 * @returns {object} - guest
 * @throws {Error} - Error
 */
const reservationUpdate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    const existingGuest = await guestService.find({ pmsId: guestPmsId });
    if (!existingGuest) {
      throw new NotFoundError("Guest not found", {});
    }
    const updatedGuest = await guestService.update(
      guestData,
      propertyId,
      existingGuest._id,
      session,
    );
    const oldStatus = await guestStatusService.getByGuestId(updatedGuest._id);
    const status = await guestStatusService.update(
      updatedGuest._id,
      guestStatusData,
      session,
    );
    const { property } = await propertyService.getById(propertyId);
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      updatedGuest._id,
    );
    if (updatedGuest.phoneNumber && updatedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldStatus, status),
        );

      await sendSmsOnNewPhoneNumber(
        existingGuest,
        updatedGuest,
        status,
        session,
      );

      await sendSmsOnPhoneNumberChange(existingGuest, updatedGuest, session);
      await sendSmsOnCheckInOrCheckOutTimeChange(
        existingGuest,
        updatedGuest,
        session,
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
      }
    }
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: { ...status._doc } },
    });
    req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

    return {
      ...updatedGuest._doc,
      status: { ...status._doc },
    };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description No Show reservation
 * @param {object} folio - folio
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {object} req - req
 * @returns {object} - guest object
 * @throws {Error}
 */
const reservationNoShow = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guest = await guestService.getByGuestPmsId(propertyId, guestPmsId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );
    console.log(guest._id);
    const guestStatus = await guestStatusService.getByGuestId(guest._id);
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    const guestStatusData = {
      reservationStatus: RESERVATION_STATUS.NO_SHOW,
    };
    const oldGuestStatus = await guestStatusService.getByGuestId(guest._id);
    const updatedGuestStatus = await guestStatusService.update(
      guest._id,
      guestStatusData,
      session,
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      guest._id,
    );
    const { property } = await propertyService.getById(propertyId);

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });
    req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    return { ...guest._doc, status: { ...updatedGuestStatus._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description Cancel reservation
 * @param {object} folio - folio
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {object} req - req
 * @returns {object} - guest object
 * @throws {Error}
 */
const reservationCancel = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guest = await guestService.getByGuestPmsId(propertyId, guestPmsId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );
    console.log(guest._id);
    const guestStatus = await guestStatusService.getByGuestId(guest._id);
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    const guestStatusData = {
      reservationStatus: RESERVATION_STATUS.CANCELLED,
    };
    const oldGuestStatus = await guestStatusService.getByGuestId(guest._id);
    const updatedGuestStatus = await guestStatusService.update(
      guest._id,
      guestStatusData,
      session,
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      guest._id,
    );
    const { property } = await propertyService.getById(propertyId);
    if (upsertedGuest.phoneNumber && upsertedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, updatedGuestStatus),
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
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
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
    }

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...updatedGuestStatus._doc } },
    });
    req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});
    return { ...guest._doc, status: { ...updatedGuestStatus._doc } };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description Cancel/No Show reservation
 * @param {object} folio - folio
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {object} req - req
 * @returns {object} - guest object
 * @throws {Error}
 */
const checkInCreate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };

    const { property } = await propertyService.getById(propertyId);
    const existingGuest = await guestService.getByGuestPmsId(
      propertyId,
      guestPmsId,
    );

    // Upsert guest
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );
    console.log("Upserted Guest", upsertedGuest);

    // Upsert guest status
    const upsertedGuestStatus = await guestStatusService.upsert(
      propertyId,
      upsertedGuest._id,
      guestStatusData,
      session,
    );
    if (!existingGuest) {
      // Create Guest Session
      const guestSession = await guestSessionService.create(
        propertyId,
        upsertedGuest._id,
        session,
      );
      // Create chat list
      const chatList = await chatListService.create(
        propertyId,
        upsertedGuest._id,
        session,
      );
      const { property } = await propertyService.getById(propertyId);

      if (upsertedGuest.phoneNumber && upsertedGuest.countryCode) {
        const messageTemplate =
          await messageTemplateService.getByNameAndPropertyId(
            propertyId,
            guestStatusToTemplateOnCreate(upsertedGuestStatus),
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
            `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
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
          ...upsertedGuest._doc,
          status: { ...upsertedGuestStatus._doc },
        },
      });

      // Emit to guest messages updated
      req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
        message: {},
      });
      await session.commitTransaction();
      session.endSession();
      return { ...upsertedGuest._doc, status: { ...upsertedGuestStatus._doc } };
    }
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      upsertedGuest._id,
    );
    if (upsertedGuest.phoneNumber && upsertedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnCreate(upsertedGuestStatus),
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
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
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

        req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

        // Emit to guest messages updated
        req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
          message: {},
        });
        req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
          guest: {
            ...upsertedGuest._doc,
            status: { ...upsertedGuestStatus._doc },
          },
        });
        await session.commitTransaction();
        session.endSession();

        return {
          ...upsertedGuest._doc,
          status: { ...upsertedGuestStatus._doc },
        };
      }
    }
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * @description Check In Update
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 */
const checkInUpdate = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guestStatusData = {
      currentStatus:
        folio.Transaction.Type === "CheckIn"
          ? GUEST_CURRENT_STATUS.IN_HOUSE
          : GUEST_CURRENT_STATUS.CHECKED_OUT,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };

    const existingGuest = await guestService.getByGuestPmsId(
      propertyId,
      guestPmsId,
    );
    console.log("here");
    const { property } = await propertyService.getById(propertyId);
    console.log("here1");
    // Upsert guest
    const updatedGuest = await guestService.updateByPmsId(
      guestData,
      guestPmsId,
      propertyId,
      session,
    );
    console.log("here2");
    if (!updatedGuest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }

    const oldGuestStatus = await guestStatusService.getByGuestId(
      updatedGuest._id,
    );

    // Upsert guest status
    const updatedGuestStatus = await guestStatusService.updatePmsGuestStatus(
      updatedGuest._id,
      propertyId,
      guestStatusData,
      session,
    );
    if (updatedGuest.phoneNumber && updatedGuest.countryCode) {
      await sendSmsOnNewPhoneNumber(
        existingGuest,
        updatedGuest,
        updatedGuestStatus,
        session,
      );
      await sendSmsOnPhoneNumberChange(existingGuest, updatedGuest, session);
      await sendSmsOnCheckInOrCheckOutTimeChange(
        existingGuest,
        updatedGuest,
        session,
      );
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, updatedGuestStatus),
        );
      const guestSession = await guestSessionService.getGuestSession(
        propertyId,
        updatedGuest._id,
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
      }

      // Emit to guest list updated
      req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

      // Emit to guest messages updated
      req.app.io.to(`guest:${updatedGuest._id}`).emit("message:newMessage", {
        message: {},
      });
    }
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: {
        ...updatedGuest._doc,
        status: { ...updatedGuestStatus._doc },
      },
    });

    await session.commitTransaction();
    session.endSession();
    return {
      ...updatedGuest._doc,
      status: { ...updatedGuestStatus._doc },
    };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

/**
 * Check Out
 * @param {object} folio - folio
 * @param {string} pmsId - pmsId
 * @param {string} propertyId - propertyId
 * @param {import('express').Request} req - Request
 * @throws {Error} - Error
 * @returns {object} - guest object
 */
const checkOut = async (folio, pmsId, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      FolioInformation,
      BusinessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    console.log(folio, pmsId, propertyId);
    const guestPmsId = FolioInformation.Number;
    const country =
      GuestInformation.HomeAddress.Country ||
      GuestInformation.BusinessAddress.Country ||
      GuestInformation.BusinessAddress.Country;
    const number =
      GuestInformation.ContactInformation.HomePhone ||
      GuestInformation.ContactInformation.BusinessPhone ||
      GuestInformation.ContactInformation.OtherPhone ||
      GuestInformation.ContactInformation.CellPhone;
    const email =
      GuestInformation.ContactInformation.HomeEmail ||
      GuestInformation.ContactInformation.BusinessEmail ||
      GuestInformation.ContactInformation.OtherEmail;
    const { countryCode, phoneNumber } = await getCountryCodeAndPhoneNumber(
      propertyId,
      number,
      country,
    );
    const guestData = {
      propertyId: propertyId,
      firstName: GuestInformation.GuestName.FirstName,
      lastName: GuestInformation.GuestName.LastName,
      email: email,
      source: BusinessSource.Name || BusinessSource.Category,
      checkIn: `${StayInformation.CheckInDate}Z`,
      checkOut: `${StayInformation.CheckOutDate}Z`,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.Number,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      draft: false,
      pmsId: FolioInformation.Number,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.CHECKED_OUT,
    };

    const { property } = await propertyService.getById(propertyId);
    // Upsert guest
    const upsertedGuest = await guestService.upsert(
      guestPmsId,
      guestData,
      propertyId,
      session,
    );

    const oldGuestStatus = await guestStatusService.getByGuestId(
      upsertedGuest._id,
    );
    // Upsert guest status
    const upsertedGuestStatus = await guestStatusService.upsert(
      propertyId,
      upsertedGuest._id,
      guestStatusData,
      session,
    );
    const guestSession = await guestSessionService.getGuestSession(
      propertyId,
      upsertedGuest._id,
    );
    if (upsertedGuest.phoneNumber && upsertedGuest.countryCode) {
      const messageTemplate =
        await messageTemplateService.getByNameAndPropertyId(
          propertyId,
          guestStatusToTemplateOnUpdate(oldGuestStatus, upsertedGuestStatus),
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
          `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
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
    }

    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...upsertedGuest._doc, status: { ...upsertedGuestStatus._doc } },
    });

    req.app.io.to(`guest:${upsertedGuest._id}`).emit("message:newMessage", {
      message: {},
    });
    // Emit to chat list updated
    req.app.io.to(`property:${propertyId}`).emit("chatList:update", {});

    return {
      ...upsertedGuest._doc,
      status: { ...upsertedGuestStatus._doc },
    };
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
};

const roomStatusUpdate = async (roomStatusData, propertyId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log(roomStatusData);
  try {
    const guest = await guestService.findGuestByGuestStatus(
      propertyId,
      {
        roomNumber: roomStatusData.RoomName,
      },
      GUEST_CURRENT_STATUS.IN_HOUSE,
    );
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given room number"],
      });
    }
    const houseKeepingRequests = await houseKeepingRequestService.find({
      propertyId,
      guestId: guest._id,
      requestStatus: REQUEST_STATUS.REQUESTED,
    });
    console.log(
      "Housekeeping Requests",
      houseKeepingRequests,
      guest._id,
      propertyId,
    );
    if (houseKeepingRequests.length <= 0) {
      throw new NotFoundError("Housekeeping request not found", {
        requestId: ["Housekeeping request not found for the given guest"],
      });
    }
    const roomStatus = roomStatusData.StatusCode;
    if (roomStatus === WEBHOOK_ROOM_STATUS_CODE.OCCUPIED_CLEAN) {
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
        guest,
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
    req.app.io.to(`property:${guest.propertyId}`).emit("addOn:newAddon", {
      count: 1,
    });
    await session.commitTransaction();
    session.endSession();
    return roomStatus;
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
  }
};

/**
 *  Send SMS on new phone number
 * @param {object} existingGuest - Existing guest object
 * @param {object} updatedGuest - Updated guest object
 * @param {object} updatedGuestStatus - Updated guest status object
 * @param {import('mongoose').ClientSession} session - Mongoose session
 * @returns {Promise<{message: import('../models/message.model.js').MessageType, chatList: import('../models/chatList.model.js').ChatListType}>} - A promise that resolves to an object containing the message and chat list.
 * @throws {Error} - Error
 */
const sendSmsOnNewPhoneNumber = async (
  existingGuest,
  updatedGuest,
  updatedGuestStatus,
  session,
) => {
  if (existingGuest.phoneNumber === "" && updatedGuest.phoneNumber !== "") {
    console.log("Sending SMS on new phone number");
    const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
      updatedGuest.propertyId,
      guestStatusToTemplateOnCreate(updatedGuestStatus),
    );
    if (messageTemplate) {
      const twilioAccount = await twilioAccountService.getByPropertyId(
        updatedGuest.propertyId,
      );
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const propertySetting = await settingService.getByPropertyId(
        updatedGuest.propertyId,
      );
      const { property } = await propertyService.getById(
        updatedGuest.propertyId,
      );
      const guestSession = await guestSessionService.getGuestSession(
        updatedGuest.propertyId,
        updatedGuest._id,
      );
      console.log(property);
      const updatedMessageBody = modifyMessageTemplateBody(
        messageTemplate,
        updatedGuest,
        property,
        propertySetting,
        `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
      );
      const sentSms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
        `${updatedMessageBody.message}`,
      );
      const message = await messageService.create(
        {
          propertyId: updatedGuest.propertyId,
          guestId: updatedGuest._id,
          senderId: updatedGuest.propertyId,
          receiverId: updatedGuest._id,
          content: updatedMessageBody.message,
          messageSid: sentSms.sid,
          messageType: messageType.SMS,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          status: "sent",
        },
        session,
      );

      const chatList = await chatListService.updateAndIncUnreadMessages(
        updatedGuest.propertyId,
        updatedGuest._id,
        {
          latestMessage: message._id,
        },
        session,
      );
      return { message, chatList };
    }
  }
};

/**
 * Sends an SMS when the phone number of a guest is changed.
 * @param {import('../models/guest.model.js').GuestType} existingGuest - The existing guest object.
 * @param {import('../models/guest.model.js').GuestType} updatedGuest - The updated guest object.
 * @param {import('mongoose').ClientSession} session - The Mongoose session.
 * @returns {Promise<{message: import('../models/message.model.js').MessageType, chatList: import('../models/chatList.model.js').ChatListType}>} - A promise that resolves to an object containing the message and chat list.
 */
const sendSmsOnPhoneNumberChange = async (
  existingGuest,
  updatedGuest,
  session,
) => {
  if (
    existingGuest.phoneNumber !== "" &&
    updatedGuest.phoneNumber !== "" &&
    (existingGuest.phoneNumber !== updatedGuest.phoneNumber ||
      existingGuest.countryCode !== updatedGuest.countryCode)
  ) {
    const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
      updatedGuest.propertyId,
      "PhoneNumber Changed",
    );
    if (messageTemplate) {
      const twilioAccount = await twilioAccountService.getByPropertyId(
        updatedGuest.propertyId,
      );
      const twilioSubClient =
        await twilioService.getTwilioClient(twilioAccount);
      const propertySetting = await settingService.getByPropertyId(
        updatedGuest.propertyId,
      );
      const { property } = await propertyService.getById(
        updatedGuest.propertyId,
      );
      const guestSession = await guestSessionService.getGuestSession(
        updatedGuest.propertyId,
        updatedGuest._id,
      );
      const updatedMessageBody = modifyMessageTemplateBodyForPhoneNumberChange(
        messageTemplate,
        updatedGuest,
        property,
        `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
      );
      const sentSms = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
        `${updatedMessageBody.message}`,
      );
      const sentSmsToOldNumber = await smsService.send(
        twilioSubClient,
        `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
        `${existingGuest.countryCode}${existingGuest.phoneNumber}`,
        `${updatedMessageBody.message}`,
      );
      const message = await messageService.create(
        {
          propertyId: updatedGuest.propertyId,
          guestId: updatedGuest._id,
          senderId: updatedGuest.propertyId,
          receiverId: updatedGuest._id,
          content: updatedMessageBody.message,
          messageSid: sentSms.sid,
          messageType: messageType.SMS,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          status: "sent",
        },
        session,
      );
      const sentMessageToOldNumber = await messageService.create(
        {
          propertyId: updatedGuest.propertyId,
          guestId: updatedGuest._id,
          senderId: updatedGuest.propertyId,
          receiverId: updatedGuest._id,
          content: updatedMessageBody.message,
          messageSid: sentSmsToOldNumber.sid,
          messageType: messageType.SMS,
          messageTriggerType: messageTriggerType.AUTOMATIC,
          status: "sent",
        },
        session,
      );

      const chatList = await chatListService.updateAndIncUnreadMessages(
        updatedGuest.propertyId,
        updatedGuest._id,
        {
          latestMessage: message._id,
        },
        session,
        2,
      );
      return { message, chatList };
    }
  }
};

/**
 * Sends an SMS when add-ons are completed.
 * @param {string} propertyId - The ID of the property.
 * @param {import('../models/guest.model.js').GuestType} guest - The guest object.
 * @param {import('mongoose').ClientSession} session - The Mongoose session.
 * @returns {Promise<{message: import('../models/message.model.js').MessageType, chatList: import('../models/chatList.model.js').ChatListType}>} - A promise that resolves to an object containing the message and chat list.
 */
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

/**
 * Get country code and phone number from a given number
 * @param {string} propertyId - The ID of the property.
 * @param {string} number - The phone number to extract the country code and phone number from.
 * @param {string} country - Optional country name to determine the country code if not present in the number.
 * @returns {Promise<{countryCode: string, phoneNumber: string}>} - An object containing the country code and phone number.
 */
const getCountryCodeAndPhoneNumber = (propertyId, number, country) => {
  if (number.split(" ").length > 1) {
    const [countryCode, phoneNumber] = number.split(" ");
    return { countryCode, phoneNumber };
  }
  return {
    countryCode: "+1",
    phoneNumber: number,
  };
};

/**
 * Sends an SMS when the check-in or check-out time of a guest is changed.
 * @param {import('../models/guest.model.js').GuestType} existingGuest - The existing guest object.
 * @param {import('../models/guest.model.js').GuestType} updatedGuest - The updated guest object.
 * @param {import('mongoose').ClientSession} session - The Mongoose session.
 * @returns {Promise<{message: import('../models/message.model.js').MessageType, chatList: import('../models/chatList.model.js').ChatListType}>} - A promise that resolves to an object containing the message and chat list.
 */
const sendSmsOnCheckInOrCheckOutTimeChange = async (
  existingGuest,
  updatedGuest,
  session,
) => {
  if (
    new Date(existingGuest.checkIn).toISOString() !==
      new Date(updatedGuest.checkIn).toISOString() ||
    new Date(existingGuest.checkOut).toISOString() !==
      new Date(updatedGuest.checkOut).toISOString()
  ) {
    console.log(
      existingGuest.checkIn,
      updatedGuest.checkIn,
      existingGuest.checkOut,
      updatedGuest.checkOut,
    );
    const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
      updatedGuest.propertyId,
      "CheckInOutTime Changed",
    );
    if (!messageTemplate) {
      return { message: null, chatList: null };
    }
    const twilioAccount = await twilioAccountService.getByPropertyId(
      updatedGuest.propertyId,
    );
    const twilioSubClient = await twilioService.getTwilioClient(twilioAccount);
    const propertySetting = await settingService.getByPropertyId(
      updatedGuest.propertyId,
    );
    const { property } = await propertyService.getById(updatedGuest.propertyId);
    const guestSession = await guestSessionService.getGuestSession(
      updatedGuest.propertyId,
      updatedGuest._id,
    );
    const updatedMessageBody = modifyCheckInOutMessageTemplateBody(
      messageTemplate,
      updatedGuest,
      property,
      propertySetting,
      `${process.env.MOBILE_FRONTEND_URL}/${guestSession._id}`,
    );
    const sentSms = await smsService.send(
      twilioSubClient,
      `${twilioAccount.countryCode}${twilioAccount.phoneNumber}`,
      `${updatedGuest.countryCode}${updatedGuest.phoneNumber}`,
      `${updatedMessageBody.message}`,
    );
    const message = await messageService.create(
      {
        propertyId: updatedGuest.propertyId,
        guestId: updatedGuest._id,
        senderId: updatedGuest.propertyId,
        receiverId: updatedGuest._id,
        content: updatedMessageBody.message,
        messageSid: sentSms.sid,
        messageType: messageType.SMS,
        messageTriggerType: messageTriggerType.AUTOMATIC,
        status: "sent",
      },
      session,
    );
    const chatList = await chatListService.updateAndIncUnreadMessages(
      updatedGuest.propertyId,
      updatedGuest._id,
      {
        latestMessage: message._id,
      },
      session,
    );
    return { message, chatList };
  }
};

module.exports = {
  bookingCreate,
  bookingUpdate,
  bookingNoShow,
  bookingCancel,
  reservationCreate,
  reservationUpdate,
  reservationNoShow,
  reservationCancel,
  checkInCreate,
  checkInUpdate,
  checkOut,
  roomStatusUpdate,
  sendSmsOnNewPhoneNumber,
  sendSmsOnPhoneNumberChange,
  sendSmsOnCheckInOrCheckOutTimeChange,
};
