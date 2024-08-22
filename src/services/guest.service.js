const logger = require("../configs/winston.config");
const { NotFoundError } = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const { GuestStatus } = require("../models/guestStatus.model");

/**
 * Create a new guest
 * @param {import('../models/guest.model').GuestType} guest - guest object
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest objec
 */
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
 * @returns {Promise<import('../models/guest.model').GuestType[]>} guests - guests object
 */
const getAll = async (propertyId) => {
  const guests = await Guest.find({ propertyId: propertyId });
  return guests;
};

/**
 * Get guest by guest id
 * @param {string} guestId - guest id
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 * @throws {NotFoundError} - If guest not foundq
 */
const getByGuestId = async (guestId) => {
  const guest = await Guest.findOne({ _id: guestId });
  if (!guest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return guest;
};

/**
 * Get guest by id
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
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
 * Update guest
 * @param {object} guest - guest object
 * @param {string} propertyId - property id
 * @param {string} guestId - guest id
 * @param {object} session - mongoose session
 * @returns {object} updatedGuest - updated guest object
 */
const update = async (guest, propertyId, guestId, session) => {
  if (guest.checkIn) {
    guest.checkIn = new Date(guest.checkIn);
  }
  if (guest.checkOut) {
    guest.checkOut = new Date(guest.checkOut);
  }
  const updatedGuest = await Guest.findOneAndUpdate(
    { _id: guestId, propertyId: propertyId },
    {
      ...guest,
      propertyId: propertyId,
    },
    { session: session, new: true },
  );
  if (!updatedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return updatedGuest;
};

/**
 * Remove guest
 * @param {string} guestId - guest id
 * @param {string} propertyId - property id
 * @param {object} session - mongoose session
 * @returns {object} removedGuest - removed guest object
 */
const remove = async (guestId, propertyId, session) => {
  const removedGuest = await Guest.findOneAndDelete(
    {
      _id: guestId,
      propertyId: propertyId,
    },
    { session: session },
  );
  if (!removedGuest) {
    throw new NotFoundError("Guest not found", {
      guestId: ["Guest not found for the given id"],
    });
  }
  return removedGuest;
};

/**
 * Get all guests with status
 * @param {string} propertyId - property id
 * @returns {Promise<import('../models/guest.model').GuestType>} guests - guests object
 */
const getAllGuestsWithStatus = async (propertyId) => {
  const guests = await GuestStatus.find({ propertyId: propertyId }).populate(
    "guestId",
  );

  return guests.map((guest) => {
    const { guestId, ...guestStatus } = { ...guest._doc };
    return {
      ...guestId._doc,
      status: guestStatus,
    };
  });
};

/**
 * Get phone numbers of guests
 * @param {string[]} guestIds - guest ids
 * @returns {object} phoneNumbers - phone numbers object
 */
const getPhoneNumbers = async (guestIds) => {
  const phoneNumbers = await Guest.find(
    { _id: { $in: guestIds } },
    { phoneNumber: 1, countryCode: 1 },
  );
  return phoneNumbers;
};

/**
 * Find one guest
 * @param {object} filter - filter object
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const find = async (filter) => {
  const guest = await Guest.findOne(filter);
  return guest;
};

/**
 * Find one guest with status
 * @param {object} guestFilter - guest filter object
 * @param {object} statusFilter - status filter object
 * @returns {Promise<import('../models/guest.model').GuestType>} guest - guest object
 */
const findWithStatus = async (guestFilter, statusFilter) => {
  const pipeline = [
    {
      $match: {
        phoneNumber: guestFilter.phoneNumber,
        countryCode: guestFilter.countryCode,
      },
    },
    {
      $lookup: {
        from: "gueststatuses",
        localField: "_id",
        foreignField: "guestId",
        as: "status",
      },
    },
    {
      $unwind: {
        path: "$status",
      },
    },
    {
      $match: {
        "status.currentStatus": statusFilter.currentStatus,
        "status.reservationStatus": statusFilter.reservationStatus,
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phoneNumber: 1,
        countryCode: 1,
        checkIn: 1,
        checkOut: 1,
        status: 1,
      },
    },
  ];

  const guest = await Guest.aggregate(pipeline);
  return guest;
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getByGuestId,
  getPhoneNumbers,
  find,
  findWithStatus,
};
