const PropertyAccess = require("../models/propertyaccess.model");

const create = async (guestId, propertyId, role) => {
  const newPropertyAccess = new PropertyAccess({
    propertyId: propertyId,
    userId: guestId,
  });
  return newPropertyAccess;
};

module.exports = { create };
