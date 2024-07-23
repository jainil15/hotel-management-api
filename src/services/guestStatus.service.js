const { default: mongoose } = require("mongoose");
const { GUEST_CURRENT_STATUS } = require("../constants/guestStatus.contant");
const { GuestStatus } = require("../models/guestStatus.model");

const create = async (propertyId, guestId, guestStatus, session) => {
  const newGuestStatus = new GuestStatus({
    guestId: guestId,
    propertyId: propertyId,
    ...guestStatus,
  });
  const savedGuestStatus = await newGuestStatus.save({ session });
  return savedGuestStatus;
};

const getByGuestId = async (guestId) => {
  const guestStatus = await GuestStatus.find({ guestId: guestId });
  return guestStatus;
};

const getByPropertyId = async (propertyId) => {
  const guestStatus = await GuestStatus.find({ propertyId: propertyId });
  return guestStatus;
};

const update = async (guestId, guestStatus) => {
  const updatedGuestStatus = await GuestStatus.findOneAndUpdate(
    { guestId: guestId },
    guestStatus,
    {
      new: true,
    },
  );
  return updatedGuestStatus;
};

module.exports = { create };
