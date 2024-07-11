const FeatureAccess = require("../models/featureaccess.model");
const Property = require("../models/property.model");

const create = async (property) => {
  try {
    const newProperty = new Property(property);
    const newFeatureAccess = new FeatureAccess({
      propertyId: newProperty._id,
      userId: req.user._id,
      role: req.user.role,
    });
    await newFeatureAccess.save();
    return await newProperty.save();
  } catch (e) {
    throw e;
  }
};

module.exports = { create };
