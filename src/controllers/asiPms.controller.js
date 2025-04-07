/**
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<void>}
 */
const folioDispatcher = (req, res, next) => {
  const payload = req.body;
  const { EventType } = payload.Transaction;
  switch (EventType) {
    case "Booking-Create":
    // TODO: Booking create
    case "Booking-Update":
    // TODO: Booking update
    case "Booking-NoShowCancel":
    // TODO: Booking no show or cancel
    case "Reservation-Create":
    // TODO: Reservation create
    case "Reservation-Update":
    // TODO: Reservation update
    case "Reservation-NoShowCancel":
    // TODO: Reservation no show or cancel
    case "CheckIn-Create":
    // TODO: Reservation check in
    case "CheckIn-Update":
    // TODO: Check in update
    case "Check-Out":
    // TODO: Guest checked out
    case "Undo":
    // TODO: Idk
  }
};

module.exports = {
  folioDispatcher,
};
