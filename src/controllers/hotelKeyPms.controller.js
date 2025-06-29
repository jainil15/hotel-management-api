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
    const updatedGuest = await hotelKeyPmsHandler.handleUpdateGuest(
      payload,
      propertyId,
      req,
    );
    return responseHandler(res, {
      updatedGuest,
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const houseKeepingDispatcher = async (req, res, next) => {
  try {
    const { payload } = req.body;
    const pmsId = payload.property_code;
    const property = await propertyService.findByPmsId(pmsId);
    if (!property) {
      throw new NotFoundError("Property not found");
    }
    const propertyId = property._id;
    const type = payload.type;
    console.log("PayLoad - ", payload);

    if (type !== "housekeeping") {
      console.log("Type - ", type);
      throw new NotFoundError("Type not found");
    }
    await hotelKeyPmsHandler.houseKeepingUpdate(
      payload.houseKeeping,
      propertyId,
      req,
    );
    return responseHandler(res, {
      message: "Housekeeping request updated successfully",
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  reservationDispatcher,
  houseKeepingDispatcher,
};
