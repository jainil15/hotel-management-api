const houseKeepingService = require("../services/houseKeepingRequest.service");
const { default: mongoose } = require("mongoose");
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

    const newHouseKeepingRequest = await houseKeepingService.create(
      propertyId,
      guestId,
      request,
      session,
    );
    console.log(guest);
    const message = houseKeepingRequestMailTemplate(guest);
    sendMail(
      "jainilpatel115@gmail.com",
      "House Keeping Request",
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
    const guest = await guestService.getById(req.guestSession.guestId);
    if (!guest) {
      throw new APIError("Guest not found", 404);
    }
    if (new Date(guest.checkIn) < new Date()) {
      throw new APIError("Guest has already checked out", 400);
    }

    const updatedHouseKeepingRequest = await houseKeepingService.update(
      requestId,
      { requestStatus },
    );
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
