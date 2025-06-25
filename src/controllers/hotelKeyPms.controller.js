const hotelKeyPmsHandler = require("../handlers/hotelKeyPms.handler.js");
const {
  APIError,
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../lib/CustomErrors.js");
const { responseHandler } = require("../middlewares/response.middleware.js");
const propertyService = require("../services/property.service.js");

const reservationDispatcher = async (req, res, next) => {
  try {
    const payload = req.body;
    console.log("PayLoad - ", payload);
    const pmsId = payload.property_code;
    const property = await propertyService.findByPmsId(pmsId);
    if (!property) {
      throw new NotFoundError("Property not found");
    }
    const propertyId = property._id;
    const type = payload.type;
    if (type !== "reservation") {
      throw new NotFoundError("Type not found");
    }
    const events = payload.change_events;
    const result = [];
    for (const event of events) {
      switch (event) {
        case "reservation_created":
          result.push(
            await hotelKeyPmsHandler.createReservation(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "reservation_status_changed":
          result.push(
            await hotelKeyPmsHandler.updateReservationStatus(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "guest_data_changed":
          result.push(
            await hotelKeyPmsHandler.updateReservationGuest(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "reservation_checked_in":
          result.push(
            await hotelKeyPmsHandler.reservationCheckedIn(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "reservation_checked_out":
          result.push(
            await hotelKeyPmsHandler.reservationCheckedOut(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "reservation_cancelled":
          result.push(
            await hotelKeyPmsHandler.reservationCancelled(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "check_out_date_extended":
          result.push(
            await hotelKeyPmsHandler.checkOutDateExtended(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "additional_guest_data_changed":
          result.push(
            await hotelKeyPmsHandler.additionalGuestDataChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "arrival_time_changed":
          result.push(
            await hotelKeyPmsHandler.arrivalTimeChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "departure_time_changed":
          result.push(
            await hotelKeyPmsHandler.departureTimeChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "room_number_changed":
          result.push(
            await hotelKeyPmsHandler.roomNumberChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "check_out_date_reduced":
          result.push(
            await hotelKeyPmsHandler.checkOutDateChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        case "check_out_date_changed":
          result.push(
            await hotelKeyPmsHandler.checkOutDateChanged(
              payload,
              propertyId,
              req,
            ),
          );
          break;
        default:
          throw new NotFoundError(`EventType ${event} not found`, {});
      }
    }

    return responseHandler(res, result);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const houseKeepingDispatcher = async (req, res, next) => {
  const payload = req.body;
  const pmsId = payload.property_code;
  const property = await propertyService.findByPmsId(pmsId);
  if (!property) {
    throw new NotFoundError("Property not found");
  }
  const propertyId = property._id;
  const type = payload.type;
  if (type !== "housekeeping") {
    throw new NotFoundError("Type not found");
  }
  const result = [];
  const events = payload.change_events;
  for (const event of events) {
    result.push(
      await hotelKeyPmsHandler.houseKeepingUpdate(
        payload.houseKeeping,
        propertyId,
        req,
      ),
    );
  }
  return responseHandler(res, result);
};

module.exports = {
  reservationDispatcher,
  houseKeepingDispatcher,
};
