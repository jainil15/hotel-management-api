const pmsHandler = require("../handlers/apiPms.handler.js");
const {
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors.js");
const { responseHandler } = require("../middlewares/response.middleware.js");

/**
 * Handles the folio request.
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<void>}
 */
const folioDispatcher = async (req, res, next) => {
  try {
    const payload = req.body;
    console.log(JSON.stringify(payload));
    const propertyId = req.params.propertyId;
    const pmsId = payload[0].ClientInformation.ClientId;
    console.log(`pmsId: ${pmsId}`);
    const result = [];
    for (const folio of payload[0].Folios) {
      const { EventName } = folio.Transaction;
      switch (EventName) {
        case "Booking-Create":
          result.push(
            await pmsHandler.bookingCreate(folio, pmsId, propertyId, req),
          );
          break;
        case "Booking-Update":
          result.push(
            await pmsHandler.bookingUpdate(folio, pmsId, propertyId, req),
          );
          break;
        case "Booking-NoShowCancel":
          result.push(
            await pmsHandler.bookingNoShowCancel(folio, pmsId, propertyId, req),
          );
          break;
        case "Reservation-Create":
          result.push(
            await pmsHandler.reservationCreate(folio, pmsId, propertyId, req),
          );
          break;
        case "Reservation-Update":
          result.push(
            await pmsHandler.reservationUpdate(folio, pmsId, propertyId, req),
          );
          break;
        case "Reservation-NoShowCancel":
          result.push(
            await pmsHandler.reservationNoShowCancel(
              folio,
              pmsId,
              propertyId,
              req,
            ),
          );
          break;
        case "CheckIn-Create":
          result.push(
            await pmsHandler.checkInCreate(folio, pmsId, propertyId, req),
          );
          break;
        case "CheckIn-Update":
          result.push(
            await pmsHandler.checkInUpdate(folio, pmsId, propertyId, req),
          );
          break;
        case "Check-Out":
          result.push(await pmsHandler.checkOut(folio, pmsId, propertyId, req));
          break;
        case "Undo":
          switch (folio.Transaction.Type) {
            case "CheckIn":
              result.push(
                await pmsHandler.checkInUpdate(folio, pmsId, propertyId, req),
              );
              break;
            case "CheckOut":
              result.push(
                await pmsHandler.checkOut(folio, pmsId, propertyId, req),
              );
              break;
            case "Reservation":
              result.push(
                await pmsHandler.reservationUpdate(
                  folio,
                  pmsId,
                  propertyId,
                  req,
                ),
              );
              break;
            case "Booking":
              result.push(
                await pmsHandler.bookingUpdate(folio, pmsId, propertyId, req),
              );
              break;
          }
          break;
        default:
          console.log("here");
          throw new NotFoundError(`EventType ${EventName} not found`, {});
      }
      return responseHandler(res, result);
    }
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Handles the room status dispatcher
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - Next function
 * @returns {Promise<void>}
 */
const roomStatusDispatcher = async (req, res, next) => {
  try {
    const payload = req.body;
    const propertyId = req.params.propertyId;
    const pmsId = payload[0].ClientInformation.ClientId;
    const roomStatuses = payload[0].RoomStatus;
    const result = [];
    console.log(roomStatuses);
    for (const roomStatus of roomStatuses) {
      result.push(
        await pmsHandler.roomStatusUpdate(roomStatus, propertyId, req),
      );
    }
    return responseHandler(res, result);
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
module.exports = {
  folioDispatcher,
  roomStatusDispatcher,
};
