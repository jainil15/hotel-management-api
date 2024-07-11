const {
  Property,
  PropertyValidationSchema,
} = require("../models/property.model");
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

    const newProperty = await propertyService.create(property);
    return res.status(200).json({ result: { property: newProperty } });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};
