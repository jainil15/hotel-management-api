const GuestStatus = require("../models/guestStatus.model");

const create = async (propertyId, guestId, status) => {
  try {
    const newGuestStatus = new GuestStatus({
      guestId: guestId,
      propertyId: propertyId,
      status: status,
      flag: true,
    });
    return newGuestStatus;
  } catch (e) {
    throw new Error("Error creating guest" + e);
  }
};

module.exports = { create };
