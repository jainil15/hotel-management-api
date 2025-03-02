const houseKeepingService = require("../services/houseKeepingRequest.service");
const { default: mongoose } = require("mongoose");
const propertyService = require("../services/property.service");
const guestStatusService = require("../services/guestStatus.service");
const {
  houseKeepingRequestMailTemplate,
  sendMail,
} = require("../utils/mail.util");
const {
  ValidationError,
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const {
  CreateHouseKeepingRequestValidationSchema,
  UpdateHouseKeepingRequestValidationSchema,
} = require("../models/houseKeepingRequest.model.js");
const { responseHandler } = require("../middlewares/response.middleware");
const guestService = require("../services/guest.service");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.guestSession;
    const request = req.body;
    const houseKeepingRequestResult =
      CreateHouseKeepingRequestValidationSchema.safeParse(request);
    if (!houseKeepingRequestResult.success) {
      throw new ValidationError("Validation Error", {
        ...houseKeepingRequestResult?.error?.flatten().fieldErrors,
      });
    }
    const property = await propertyService.getById(propertyId);
    if (!property.property) {
      throw new NotFoundError("Property not found", {});
    }
    const guest = await guestService.getById(guestId, propertyId);
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    if (new Date(guest.checkOut) < new Date()) {
      throw new ValidationError("Guest has already checked out", {});
    }
    if (new Date(guest.checkIn) > new Date()) {
      throw new ValidationError("Guest has not checked in yet", {});
    }
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    if (guestStatus.currentStatus !== GUEST_CURRENT_STATUS.IN_HOUSE) {
      throw new ValidationError("Guest is not in house", {});
    }

    const newHouseKeepingRequest = await houseKeepingService.create(
      propertyId,
      guestId,
      request,
      session,
    );
    console.log(property.property.email);
    const message = houseKeepingRequestMailTemplate(guest);
    sendMail(
      property.property.email,
      "Request for house keeping",
      message,
      "House Keeping Request",
    );
    req.app.io.to(`property:${propertyId}`).emit("addOn:newAddon", {
      count: 1,
    });
    req.app.io.to(`property:${propertyId}`).emit("request:update", {});
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, newHouseKeepingRequest);
  } catch (e) {
    console.log(e);
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const updateStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = req.params;
    const { requestStatus } = req.body;
    const houseKeepingRequestResult =
      UpdateHouseKeepingRequestValidationSchema.safeParse({ requestStatus });
    if (!houseKeepingRequestResult.success) {
      throw new ValidationError("Validation Error", {
        ...houseKeepingRequestResult?.error?.flatten().fieldErrors,
      });
    }

    const updatedHouseKeepingRequest = await houseKeepingService.update(
      requestId,
      { requestStatus },
    );
    const guest = await guestService.getById(
      updatedHouseKeepingRequest.guestId,
      updatedHouseKeepingRequest.propertyId,
    );
    if (!guest) {
      throw new NotFoundError("Guest not found", {});
    }
    if (new Date(guest.checkOut) < new Date()) {
      throw new ValidationError("Guest has already checked out", {});
    }
    req.app.io
      .to(`property:${updatedHouseKeepingRequest.propertyId}`)
      .emit("request:update", {});
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, updatedHouseKeepingRequest);
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
  create,
  updateStatus,
};
