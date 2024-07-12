const PropertyAccess = require("../models/propertyaccess.model");

const create = async (guestId, propertyId, role) => {
  try {
    const newPropertyAccess = new PropertyAccess({
      propertyId: propertyId,
      userId: guestId,
    });
    return newPropertyAccess;
  } catch (e) {
    throw new Error("Error creating property access" + e);
  }
};

module.exports = { create };
