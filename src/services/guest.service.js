const logger = require("../configs/winston.config");
const { NotFoundError } = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const { GuestStatus } = require("../models/guestStatus.model");

const create = async (guest, propertyId, session) => {
  try {
    const newGuest = new Guest({ ...guest, propertyId: propertyId });
    const savedGuest = await newGuest.save({ session });
    return savedGuest;
  } catch (e) {
    throw new Error("Error while creating guest");
  }
};

/**
 * Get all guests
 * @param {string} propertyId - property id
 * @returns {Array} guests - array of guests
 */
const getAll = async (propertyId) => {
  const guests = await Guest.find({ propertyId: propertyId });
  return guests;
};

const getById = async (guestId, propertyId) => {
  const guest = await Guest.findOne({ _id: guestId, propertyId: propertyId });
  if (!guest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return guest;
};
/**
 * @param {object} guest - guest object
 * @param {string} propertyId - property id
 * @param guestId
 * @param {*} session - mongoose session
 * @returns {object} updatedGuest - updated guest object
 */
const update = async (guest, propertyId, guestId, session) => {
  
  const updatedGuest = await Guest.findOneAndUpdate(
    { _id: guestId, propertyId: propertyId },
    {
      ...guest,
      propertyId: propertyId,
    },
    { session: session }
  );
  if (!updatedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return updatedGuest;
};

const remove = async (guestId, propertyId) => {
  const removedGuest = await Guest.findOneAndDelete({
    _id: guestId,
    propertyId: propertyId,
  });
  if (!removedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return removedGuest;
};

const getAllGuestsWithStatus = async (propertyId) => {
  const guests = await GuestStatus.find({ propertyId: propertyId }).populate(
    "guestId"
  );

  return guests.map((guest) => {
    const { guestId, ...guestStatus } = { ...guest._doc };
    return {
      ...guestId._doc,
      status: guestStatus,
    };
  });
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
};
