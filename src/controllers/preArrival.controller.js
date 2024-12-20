const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const preArrivalService = require("../services/preArrival.service");
const {
  CreatePreArrivalValidationSchema,
} = require("../models/preArrival.model");
const preArrivalFlowService = require("../services/preArrivalFlow.service");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const { PRE_ARRIVAL_STATUS } = require("../constants/guestStatus.contant");
const { ROLE } = require("../constants/role.constant");
const { validatePreArrivalFlow } = require("../utils/preArrival.util");

/**
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId, guestId } = req.params;
    const preArrival = req.body;

    const preArrivalResult =
      CreatePreArrivalValidationSchema.safeParse(preArrival);

    if (!preArrivalResult.success) {
      throw new ValidationError("Input Validation Error", {
        ...preArrivalResult.error.flatten().fieldErrors,
      });
    }
    const preArrivalFlow =
      await preArrivalFlowService.getByPropertyId(propertyId);

    if (!validatePreArrivalFlow(preArrivalFlow._doc, preArrival)) {
      throw new ValidationError("Validation Error", {
        preArrival: "Invalid pre arrival flow",
      });
    }

    const existingGuest = await guestService.getByGuestId(guestId);
    if (!existingGuest) {
      throw new ForbiddenError("Guest does not exist", {});
    }
    const existingPreArrival = await preArrivalService.getByGuestId(guestId);

    if (existingPreArrival) {
      throw new ConflictError("Pre arrival already exists", {});
    }
    const newPreArrival = await preArrivalService.create(
      propertyId,
      guestId,
      preArrivalResult.data,
      session,
    );

    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      { preArrival: PRE_ARRIVAL_STATUS.APPLIED },
      session,
      ROLE.GUEST,
    );

    await session.commitTransaction();
    session.endSession();

    req.app.io.to(`property:${propertyId}`).emit("guestStatus:update", {
      guestStatus: updatedGuestStatus,
    });
    return responseHandler(res, { preArrival: newPreArrival });
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
 * @param {import('express').Request} req - Request object
 * @param {import('express').Response} res - Response object
 * @param {import('express').NextFunction} next - Next function
 */
const getByGuestId = async (req, res, next) => {
  try {
    const { propertyId, guestId } = req.params;
    const existingGuest = await guestService.getById(guestId, propertyId);
    if (!existingGuest) {
      throw new ForbiddenError("Guest does not exist", {});
    }

    const preArrival = await preArrivalService.getByGuestId(user._id);
    return responseHandler(res, { preArrival });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  create,
  getByGuestId,
};
