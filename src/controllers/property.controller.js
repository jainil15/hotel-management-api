const { PropertyValidationSchema } = require("../models/property.model");
const propertyService = require("../services/property.service");
const create = async (req, res) => {
  try {
    const property = req.body;

    const result = PropertyValidationSchema.safeParse(property);
    // validation errors
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }

    const newProperty = await propertyService.create(property, req.user);
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
