const { default: mongoose } = require("mongoose");
const {
  ValidationError,
  APIError,
  InternalServerError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  PropertyValidationSchema,
  UpdatePropertyValidationSchema,
} = require("../models/property.model");
const {
  SettingValidationSchema,
  UpdateSettingValidationSchema,
} = require("../models/setting.model");
const propertyService = require("../services/property.service");
const messageTemplateService = require("../services/messageTemplate.service");
const settingService = require("../services/setting.service");
const workflowService = require("../services/workflow.service");
const checkImageType = require("../utils/checkType");

/**
 * Create property
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      standardCheckinTime,
      standardCheckoutTime,
      timezone,
      defaultNewDayTime,
      ...property
    } = req.body;

    // validation errors
    const result = PropertyValidationSchema.safeParse({
      ...property,
      logo: req.files.logo,
      cover: req.files.cover,
    });
    const settingResult = SettingValidationSchema.safeParse({
      standardCheckinTime,
      standardCheckoutTime,
      timezone,
      defaultNewDayTime,
    });
    // validation errors
    if (!result.success || !settingResult.success) {
      throw new ValidationError("Validation Error", {
        ...result?.error?.flatten().fieldErrors,
        ...settingResult?.error?.flatten().fieldErrors,
      });
    }

    // check if email already exists
    let oldProperty = await propertyService.getByEmail(property.email);
    if (oldProperty) {
      throw new ConflictError("Property with this email already exists", {
        email: ["Property with this email already exists"],
      });
    }

    // create new property
    const newProperty = await propertyService.create(
      property,
      req.files,
      req.user,
      settingResult.data,
      session,
    );

    const defaultTemplates = await messageTemplateService.createDefaults(
      newProperty._id,
      session,
    );
    const defaultWorkflow = await workflowService.createDefaults(
      newProperty._id,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      { property: newProperty },
      201,
      "Property created",
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

/**
 * Get all properties of a user
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getAll = async (req, res, next) => {
  try {
    const properties = await propertyService.getAll(req.user);

    if (!properties) {
      throw new NotFoundError("No properties found", {});
    }
    return responseHandler(res, { properties: properties });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Get property by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getById = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;

    const property = await propertyService.getById(propertyId);
    const setting = await settingService.getByPropertyId(propertyId);
    return responseHandler(res, { property: property, setting: setting });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

/**
 * Update property by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      standardCheckinTime,
      standardCheckoutTime,
      timezone,
      defaultNewDayTime,
      ...property
    } = req.body;
    property.logo = req.files.logo;
    property.cover = req.files.cover;
    const propertyId = req.params.propertyId;
    const propertyResult = UpdatePropertyValidationSchema.safeParse({
      ...property,
    });
    const settingResult = UpdateSettingValidationSchema.safeParse({
      standardCheckinTime,
      standardCheckoutTime,
      timezone,
      defaultNewDayTime,
    });

    // validation errors
    if (!propertyResult.success || !settingResult.success) {
      throw new ValidationError("Validation Error", {
        ...propertyResult?.error?.flatten().fieldErrors,
        ...settingResult?.error?.flatten().fieldErrors,
      });
    }

    const updatedSetting = await settingService.updateByPropertyId(
      propertyId,
      {
        standardCheckinTime,
        standardCheckoutTime,
        timezone,
        defaultNewDayTime,
      },
      session,
    );
    const updatedProperty = await propertyService.update(
      propertyId,
      property,
      req.files,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, {
      property: updatedProperty,
      setting: updatedSetting,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e.code === 11000) {
      return next(
        new ConflictError("Property with this email already exists", {
          email: ["Property with this email already exists"],
        }),
      );
    }
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Remove property by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const remove = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const removedProperty = await propertyService.remove(propertyId);
    return responseHandler(res, { property: removedProperty });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

module.exports = { create, getAll, getById, update, remove };
