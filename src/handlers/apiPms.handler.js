const {
  GUEST_CURRENT_STATUS,
  RESERVATION_STATUS,
} = require("../constants/guestStatus.contant");

/**
 * @description Create a new booking
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<import('express').Response>}
 * @throws {Error} - Error
 */
const bookingCreate = async (req, res, next) => {
  const folio = req.body.Folios[0];
  const {
    FolioInformation,
    BuissnessSource,
    GroupInformation,
    GuestInformation,
    StayInformation,
  } = folio;
  const guestData = {
    firstName: GuestInformation.FirstName,
    lastName: GuestInformation.LastName,
    email: GuestInformation.Email,
    source: BuissnessSource.Source,
    checkIn: StayInformation.CheckInDate,
    checkOut: StayInformation.CheckOutDate,
    roomNumber: StayInformation.Room,
    confirmationNumber: FolioInformation.CRSFolioNumber,
    // TODO: country code and phonenumber test
    phoneNumber: GuestInformation.Phone.split("-").join(""),
    countryCode: GuestInformation.CountryCode,

    status: {
      currentStatus: GUEST_CURRENT_STATUS.RESERVED,
      reservationStatus: RESERVATION_STATUS.CONFIRMED,
    },
  };
};

module.exports = {
  bookingCreate,
};
