const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
} = require("../constants/guestStatus.contant");

const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const guestSessionService = require("../services/guestSession.service");
const chatListService = require("../services/chatList.service");
const messageService = require("../services/message.service");
const propertyService = require("../services/property.service");

/**
 * @description Create a new booking
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const bookingCreate = async (req, res, next) => {
  try {
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const propertyId = req.params.propertyId;
    const pmsId = req.body.ClientInformation.ClientId;
    const guestData = {
      propertyId: propertyId,
      pmsId: pmsId,

      firstName: GuestInformation.FirstName,
      lastName: GuestInformation.LastName,
      email: GuestInformation.Email,
      source: BuissnessSource.Source,
      checkIn: StayInformation.CheckInDate,
      checkOut: StayInformation.CheckOutDate,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.CRSFolioNumber,
      // TODO: country code and phonenumber test
      //
      phoneNumber: GuestInformation.Phone.split("-").join(""),
      countryCode: GuestInformation.CountryCode,
      draft: true,
    };
    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    // const existingInHouseGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guestData.phoneNumber,
    //     countryCode: guestData.countryCode,
    //     propertyId: guestData.propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.IN_HOUSE,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // console.log("Exisint guest  inhouse confirmed", existingInHouseGuest);
    // if (existingInHouseGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }
    // const existingReservedGuest = await guestService.findWithStatus(
    //   {
    //     phoneNumber: guestData.phoneNumber,
    //     countryCode: guestData.countryCode,
    //     propertyId: guestData.propertyId,
    //   },
    //   {
    //     currentStatus: GUEST_CURRENT_STATUS.RESERVED,
    //     reservationStatus: RESERVATION_STATUS.CONFIRMED,
    //   },
    // );
    // console.log("Exisint guest  reservation confirmed", existingInHouseGuest);
    // if (existingReservedGuest.length > 0) {
    //   throw new ValidationError("Guest already exists with this phone number", {
    //     phoneNumber: ["Guest already exists with this phone number"],
    //   });
    // }

    // Create guest
    const newGuest = await guestService.create(guest, propertyId, session);

    // Create guest status
    const newGuestStatus = await guestStatusService.create(
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
 * @description Create a new booking
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const bookingUpdate = async (req, res, next) => {
  try {
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const propertyId = req.params.propertyId;
    const pmsId = req.body.ClientInformation.ClientId;
    const guestData = {
      propertyId: propertyId,
      pmsId: pmsId,

      firstName: GuestInformation.FirstName,
      lastName: GuestInformation.LastName,
      email: GuestInformation.Email,
      source: BuissnessSource.Source,
      checkIn: StayInformation.CheckInDate,
      checkOut: StayInformation.CheckOutDate,
      roomNumber: StayInformation.Room,
      confirmationNumber: FolioInformation.CRSFolioNumber,
      // TODO: country code and phonenumber test
      //
      phoneNumber: GuestInformation.Phone.split("-").join(""),
      countryCode: GuestInformation.CountryCode,
    };

    const guestStatusData = {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    };
    const guest = await guestService.findByPmsId(propertyId, pmsId);

    // Update guest
    const updatedGuest = await guestService.update(
      guestData,
      propertyId,
      guest._id,
      session,
    );

    // Update guest status
    const updatedGuestStatus = await guestStatusService.update(
      propertyId,
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
    return responseHandler(
      res,
      { guest: { ...updatedGuest._doc, status: { ...updatedGuest._doc } } },
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

const bookingNoShowCancel = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const folio = req.body.Folios[0];
    const {
      FolioInformation,
      BuissnessSource,
      GroupInformation,
      GuestInformation,
      StayInformation,
    } = folio;
    const pmsId = req.body.ClientInformation.ClientId;
    const guest = await guestService.findByPmsId(propertyId, pmsId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {
        guestId: ["Guest not found for the given id"],
      });
    }
    const guestStatus = await guestStatusService.findByGuestId(
      propertyId,
      guest._id,
    );
    if (!guestStatus) {
      throw new NotFoundError("Guest status not found", {
        guestId: ["Guest status not found for the given id"],
      });
    }
    const guestStatusData = {
      reservationStatus: RESERVATION_STATUS.CANCELLED,
    };
    const updatedGuestStatus = await guestStatusService.update(
      propertyId,
      guest._id,
      guestStatusData,
      session,
    );

    // Emit to guest list updated
    await session.commitTransaction();
    session.endSession();

    // Emit to guest list updated
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...guest._doc, status: { ...updatedGuestStatus._doc } },
    });
    return responseHandler(
      res,
      { guest: { ...guest._doc, status: { ...updatedGuestStatus._doc } } },
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

module.exports = {
  bookingCreate,
  bookingUpdate,
  bookingNoShowCancel,
};
