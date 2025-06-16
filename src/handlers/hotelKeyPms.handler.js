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
} = require("../utils/messageTemplateUpdate");
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
    const newGuest = await guestService.create(guestData, { session });

    // Create guest status
    const guestStatusData = {
      guestId: newGuest._id,
      propertyId,
      currentStatus: mapBookingStatusToGuestStatus(reservation.booking_status),
    };

    await guestStatusService.create(guestStatusData, { session });

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

const updateReservationGuest = async (folio,propertyId,req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validationResult = HotelKeyReservationSchema.safeParse(folio);
    if (!validationResult.success) {
      throw new ValidationError(
        "Invalid reservation data",
        validationResult.error.flatten().fieldErrors,
      );
    }
    const { reservation, additional_guest_info } = folio;
    const { guest_info } = reservation;
    const pmsPropertyId = folio.property_id;
    const propertyId =
      await hotelKeyPmsService.getPropertyByHotelKeyId(pmsPropertyId);
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
    const countryCode = guest_info.country
      ? countries.find(
          (c) => c.iso2.toLowerCase() === guest_info.country.toLowerCase(),
        )?.dialCode || "+1"
      : "+1";

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
    const updatedGuestStatus = await guestStatusService.update(
      guestStatus._id,
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
