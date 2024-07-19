const { PropertyValidationSchema } = require("../models/property.model");
const { SettingValidationSchema } = require("../models/setting.model");
const propertyService = require("../services/property.service");
const checkImageType = require("../utils/checkType");

const create = async (req, res) => {
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
      return res.status(400).json({
        error: {
          ...result?.error?.flatten().fieldErrors,
          ...settingResult?.error?.flatten().fieldErrors,
        },
      });
    }

    // check if email already exists
    const oldProperty = await propertyService.getByEmail(property.email);
    if (oldProperty) {
      return res.status(400).json({
        error: {
          email: "Email already exists",
        },
      });
    }
    // create new property
    const newProperty = await propertyService.create(
      property,
      req.files,
      req.user,
      settingResult.data
    );

    return res.status(200).json({ result: { property: newProperty } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const getAll = async (req, res) => {
  try {
    const properties = await propertyService.getAll(req.user);
    return res.status(200).json({ result: { properties: properties } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const getById = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;

    const property = await propertyService.getById(propertyId);
    return res.status(200).json({ result: { property: property } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const update = async (req, res) => {
  try {
    const property = req.body;
    const propertyId = req.params.propertyId;
    const result = PropertyValidationSchema.safeParse({
      ...property,
    });
    // validation errors
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    const updatedProperty = await propertyService.update(property, propertyId);
    return res.status(200).json({ result: { property: updatedProperty } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const remove = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const removedProperty = await propertyService.remove(propertyId);
    return res.status(200).json({ result: { property: removedProperty } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

module.exports = { create, getAll, getById, update, remove };
