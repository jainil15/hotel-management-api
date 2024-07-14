const GuestStatus = require("../models/guestStatus.model");

const create = async (propertyId, guestId, status) => {
  try {
    const newGuestStatus = new GuestStatus({
      guestId: guestId,
      propertyId: propertyId,
      status: status,
      flag: true,
    });
    const savedGuestStatus = await newGuestStatus.save();
    return savedGuestStatus;
  } catch (e) {
    throw new Error("Error creating guest" + e);
  }
};

module.exports = { create };
