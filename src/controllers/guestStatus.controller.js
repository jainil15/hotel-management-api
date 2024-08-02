const { default: mongoose } = require("mongoose");
const guestStatusService = require("../services/guestStatus.service");

const {
  GuestStatusValidationSchema,
  UpdateGuestStatusValidationSchema,
  CreateGuestStatusValidationSchema,
} = require("../models/guestStatus.model");
const {
  ValidationError,
  InternalServerError,
  APIError,
  UnauthorizedError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { validateStatusForGuest } = require("../utils/guestStatus.util");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.params;
    const guestStatus = req.body;
    const result = CreateGuestStatusValidationSchema.safeParse({
      guestId,
      propertyId,
      ...guestStatus,
    });
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors
      );
    }
    const savedGuestStatus = await guestStatusService.create(
      propertyId,
      guestId,
      guestStatus,
      session
    );
    await session.commitTransaction();
    await session.endSession();
    return responseHandler(
      res,
      { guestStatus: savedGuestStatus },
      201,
      "Guest Status Created"
    );
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const getByGuestId = async (req, res, next) => {
  try {
    const { guestId } = req.params;
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    if (!guestStatus) {
      return responseHandler(res, {}, 404, "Guest Status Not Found");
    }
    return responseHandler(res, { guestStatus }, 200, "Guest Status Found");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.params;
    const guestStatus = req.body;

    const result = UpdateGuestStatusValidationSchema.safeParse({
      guestId,
      propertyId,
      ...guestStatus,
    });
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors
      );
    }

    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      guestStatus,
      session,
      req.user.role
    );

    if (!updatedGuestStatus) {
      return responseHandler(res, {}, 404, "Guest Status Not Found");
    }

    req.app.io
      .to(`property:${updatedGuestStatus.propertyId}`)
      .emit("guest:guestStatusUpdate", { guestStatus: updatedGuestStatus });
    await session.commitTransaction();
    await session.endSession();
    return responseHandler(
      res,
      { guestStatus: updatedGuestStatus },
      200,
      "Guest Status Updated"
    );
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { create, getByGuestId, update };
