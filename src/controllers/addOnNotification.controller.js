const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const addOnsNotificationService = require("../services/addOnsNotification.service");
const addOnsFlowService = require("../services/addOnsFlow.service");
const {
  UpdateAddOnNotificationSchema,
} = require("../models/addOnNotification.model");
const { responseHandler } = require("../middlewares/response.middleware");
/**
 * Controller function
 * @callback Controller
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 * @param {import("express").NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - A Promise that resolves when the response is sent or `next()` is called
 */

/**
 * Get add-on notifications for a property
 * @type {Controller}
 */
const get = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const addOnsNotification =
      await addOnsNotificationService.getByPropertyId(propertyId);
    return responseHandler(
      res,
      addOnsNotification || { addOnNotifications: [] },
    );
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error));
  }
};

const getForUpdate = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const addOnsFlow = await addOnsFlowService.getByPropertyId(propertyId);
    const addOns = [
      ...(addOnsFlow?.customAddOns ?? []),
      ...(addOnsFlow?.checkInOutAddOns ?? []),
      addOnsFlow?.upgradeRoom,
      addOnsFlow?.houseKeepingAddOns,
    ];
    const addOnsNotifications =
      (await addOnsNotificationService.getByPropertyId(propertyId))
        ?.addOnNotifications || [];
    console.log(addOnsNotifications);
    const addOnsToUpdate = [];
    for (const addOn of addOns) {
      const addOnExists = addOnsNotifications.find(
        (notification) =>
          notification.addOnId.toString() === addOn._id.toString(),
      );
      if (addOnExists) {
        addOnsToUpdate.push(addOnExists);
        continue;
      }
      addOnsToUpdate.push({
        addOnId: addOn._id,
        enabled: false,
        type: addOn.name,
        phoneNumber: "",
        countryCode: "+1",
        email: "",
      });
    }
    return responseHandler(res, {
      addOnNotifications: addOnsToUpdate,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error));
  }
};

/**
 * Update an existing add-on notification
 * @param {import("express").Request} req - The request object
 * @param {import("express").Response} res - The response object
 * @param {import("express").NextFunction} next - The next middleware function
 * @returns {Promise<void>} - Returns nothing, but sends a response or calls next
 */
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const addOnNotification = req.body;
    if (addOnNotification.length === 0) {
      return responseHandler(res, {
        addOnNotifications: [],
      });
    }
    const result = UpdateAddOnNotificationSchema.safeParse(addOnNotification);
    if (!result.success) {
      throw new ValidationError(
        "Invalid Fields",
        result.error.flatten().fieldErrors,
      );
    }
    const { addOnNotifications } = result.data;

    const addOnsFlow = await addOnsFlowService.getByPropertyId(propertyId);
    const addOns = [
      ...(addOnsFlow?.customAddOns ?? []),
      ...(addOnsFlow?.checkInOutAddOns ?? []),
      addOnsFlow?.upgradeRoom,
      addOnsFlow?.houseKeepingAddOns,
    ];
    addOnNotifications.forEach((addOn) => {
      if (!addOn.addOnId) {
        throw new ValidationError("Invalid Fields", {
          addOnId: ["Add-on ID is required."],
        });
      }
      const addOnExists = addOns.some(
        (existingAddOn) => existingAddOn._id.toString() === addOn.addOnId,
      );
      if (!addOnExists) {
        throw new ValidationError("Invalid Fields", {
          addOnId: ["Add-on ID does not exist."],
        });
      }
    });

    const updatedAddOnNotification = await addOnsNotificationService.upsert(
      propertyId,
      result.data,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, updatedAddOnNotification);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new InternalServerError(error));
  }
};

module.exports = {
  update,
  get,
  getForUpdate,
};
