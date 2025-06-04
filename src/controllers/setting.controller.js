const {
  APIError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} = require("../lib/CustomErrors");
const { UpdateSettingValidationSchema } = require("../models/setting.model");
const { responseHandler } = require("../middlewares/response.middleware");
const settingService = require("../services/setting.service");
const propertyService = require("../services/property.service");
const mongoose = require("mongoose");

const getByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const setting = await settingService.getByPropertyId(propertyId);
    if (!setting) {
      throw new NotFoundError("Setting not found for the property", {
        propertyId: ["Setting not  found for this propertyId"],
      });
    }
    return responseHandler(res, { setting: setting });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const settingData = req.body;
    const settingResult = UpdateSettingValidationSchema.safeParse(settingData);
    if (!settingResult.success) {
      throw new ValidationError("Validation Error", {
        ...settingResult.error.flatten().fieldErrors,
      });
    }
    const updatedSetting = await settingService.updateByPropertyId(
      propertyId,
      settingResult.data,
      session,
    );
    if (!updatedSetting) {
      throw new NotFoundError("Setting not found for the property", {
        propertyId: ["Setting not found for this propertyId"],
      });
    }
    if (updatedSetting.pmsId) {
      const property = await propertyService.updatePmsId(
        propertyId,
        updatedSetting.pmsId,
        session,
      );
    }
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { setting: updatedSetting });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { getByPropertyId, update };
