const { DeletedGuest } = require("../models/deletedGuest.model");

/**
 * Create a deleted guest
 * @param {string} propertyId - The property id
 * @param {import('../models/guest.model.js').GuestType} guest - The guest object
 * @param {import("mongoose").ClientSession} session - The session
 * @returns {Promise<import('../models/deletedGuest.model.js').DeletedGuestType>} - The deleted guest
 */
const create = async (propertyId, guest, session) => {
  const newDeletedGuest = new DeletedGuest({
    ...guest,
    propertyId,
  });
  const savedDeletedGuest = await newDeletedGuest.save({ session: session });
  return savedDeletedGuest;
};

/**
 * Get deleted guests by property id
 * @param {string} propertyId - The property id
 * @returns {Promise<import('../models/deletedGuest.model.js').DeletedGuestType[]>} - The deleted guests
 */
const getDeletedGuestsByPropertyId = async (propertyId) => {
  const deletedGuests = await DeletedGuest.find({ propertyId });
  return deletedGuests;
};

module.exports = { create, getDeletedGuestsByPropertyId };
