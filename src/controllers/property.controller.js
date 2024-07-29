const { default: mongoose } = require("mongoose");
const {
  ValidationError,
  APIError,
  InternalServerError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { PropertyValidationSchema } = require("../models/property.model");
const { SettingValidationSchema } = require("../models/setting.model");
const propertyService = require("../services/property.service");
const messageTemplateService = require("../services/messageTemplate.service");
const checkImageType = require("../utils/checkType");

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
    const oldProperty = await propertyService.getByEmail(property.email);
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
      session
    );
    
    const defaultTemplates = await messageTemplateService.createDefaults(
      newProperty._id,
      session
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      { property: newProperty },
      201,
      "Property created"
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

const getById = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;

    const property = await propertyService.getById(propertyId);
    return responseHandler(res, { property: property });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const update = async (req, res, next) => {
  try {
    const property = req.body;
    const propertyId = req.params.propertyId;
    const result = PropertyValidationSchema.safeParse({
      ...property,
    });
    // validation errors
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors
      );
    }
    const updatedProperty = await propertyService.update(property, propertyId);
    return responseHandler(res, { property: updatedProperty });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

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
