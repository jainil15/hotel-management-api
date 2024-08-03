const { default: mongoose } = require("mongoose");
const {
  CreateGuestValidationSchema,
  UpdateGuestValidationSchema,
} = require("../models/guest.model");
const guestService = require("../services/guest.service");
const guestStatusService = require("../services/guestStatus.service");
const guestTokenService = require("../services/guestToken.service");
const twilioService = require("../services/twilio.service");
const twilioAccountService = require("../services/twilioAccount.service");
const propertyService = require("../services/property.service");
const {
  CreateGuestStatusValidationSchema,
  UpdateGuestStatusValidationSchema,

  GetGuestFiltersValidationSchema,
} = require("../models/guestStatus.model");
const logger = require("../configs/winston.config");

const { responseHandler } = require("../middlewares/response.middleware");
const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");

const { validateStatus } = require("../utils/guestStatus.util");
const { z } = require("zod");
require("dotenv").config();

const getAll = async (req, res, next) => {
  try {
    const guests = await guestService.getAll(req.params.propertyId);
    return responseHandler(res, { guests: guests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // TODO: add messageGuest
    const { sendMessage, status, ...guest } = req.body;
    const propertyId = req.params.propertyId;

    // Validate guest and status
    const guestResult = CreateGuestValidationSchema.safeParse(guest);
    const statusResult = CreateGuestStatusValidationSchema.safeParse(status);
    const sendMessageResult = z.boolean().safeParse(sendMessage);
    // Validate guest and status
    if (
      !guestResult.success ||
      !statusResult.success ||
      !sendMessageResult.success
    ) {
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...statusResult?.error?.flatten().fieldErrors,
        ...sendMessageResult?.error?.flatten().fieldErrors,
      });
    }

    // Check if status is valid
    if (!validateStatus(status)) {
      throw new ValidationError("Invalid Status", {
        currentStatus: "Invalid Status",
      });
    }

    // Create guest
    const newGuest = await guestService.create(guest, propertyId, session);

    // Create guest status
    const newGuestStatus = await guestStatusService.create(
      propertyId,
      newGuest._id,
      status,
      session
    );

    if (sendMessage === true) {
      // get access token for guest login
      const accessToken = await guestTokenService.create(newGuest._id, session);
      // Get property
      const property = await propertyService.getById(propertyId);

      // Send message to the guest
      const message = `Welcome to ${property.name}, You guest portal link is: ${process.env.MOBILE_FRONTEND_URL}/login?token=${accessToken}`;
      await twilioService.sendAccessLink(
        propertyId,
        `${newGuest.countryCode + newGuest.phoneNumber}`,
        message
      );
    }
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } },
    });
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      { guest: { ...newGuest._doc, status: { ...newGuestStatus._doc } } },
      201,
      "Guest Created"
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

const getById = async (req, res, next) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;
    const guest = await guestService.getById(guestId, propertyId);
    const guestStatus = await guestStatusService.getByGuestId(guestId);
    return responseHandler(res, {
      guest: { ...guest._doc, status: guestStatus },
    });
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
    // TODO: add messageGuest
    const { status, ...guest } = req.body;
    const propertyId = req.params.propertyId;
    const guestId = req.params.guestId;
    const guestResult = await UpdateGuestValidationSchema.safeParseAsync(guest);
    const statusResult =
      await UpdateGuestStatusValidationSchema.safeParseAsync(status);
    if (!guestResult.success || !statusResult.success) {
      throw new ValidationError("Validation Error", {
        ...guestResult?.error?.flatten().fieldErrors,
        ...guestResult?.error?.flatten().fieldErrors,
      });
    }
    const updatedGuest = await guestService.update(
      guest,
      propertyId,
      guestId,
      session
    );
    const updatedGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session
    );
    await session.commitTransaction();
    session.endSession();
    req.app.io.to(`property:${propertyId}`).emit("guest:guestUpdate", {
      guest: { ...updatedGuest._doc, status: updatedGuestStatus },
    });
    return responseHandler(
      res,
      {
        guest: { ...updatedGuest._doc, status: updatedGuestStatus },
      },
      200,
      "Guest Updated"
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(
      new InternalServerError("Internal server error while updating")
    );
  }
};

const remove = async (req, res, next) => {
  try {
    const guestId = req.params.guestId;
    const propertyId = req.params.propertyId;
    const removedGuest = await guestService.remove(guestId, propertyId);
    return responseHandler(res, { guest: removedGuest });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const getAllGuestsWithStatus = async (req, res, next) => {
  try {
    const filters = req.query;
    const filtersResult = GetGuestFiltersValidationSchema.safeParse(filters);

    const propertyId = req.params.propertyId;
    if (!filtersResult.success) {
      throw new ValidationError(
        "Validation Error",
        filtersResult.error.flatten().fieldErrors
      );
    }

    // let guests = await guestService.getAllGuestsWithStatus(propertyId);
    const guests = await guestStatusService.getAllGuestWithStatusv2(
      propertyId,
      filtersResult.data
    );

    return responseHandler(res, { guests: guests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
};
