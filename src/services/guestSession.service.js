const { GuestSession } = require("../models/guestSession.model");

/**
 * Create a guest session
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} session - The session object
 * @return {Promise<import('../models/guestSession.model').GuestSessionType>} - The guest session
 */
const create = async (propertyId, guestId, session) => {
  const guestSession = new GuestSession({ propertyId, guestId });
  const savedGuestSession = await guestSession.save({ session });
  return savedGuestSession;
};

/**
 * Get guest session by id
 * @param {string} sessionId - The session id
 * @return {Promise<import('../models/guestSession.model').GuestSessionType>} - The guest session
 */
const getById = async (sessionId) => {
  const guestSession = await GuestSession.findById(sessionId);
  return guestSession;
};

/**
 * Update guest session
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} guestSession - The guest session object
 * @param {import('mongoose').ClientSession} session - The session
 * @return {Promise<import('../models/guestSession.model').GuestSessionType>} - The updated guest session
 */
const update = async (propertyId, guestId, guestSession, session) => {
  const updatedGuestSession = await GuestSession.findOneAndUpdate(
    { propertyId, guestId },
    guestSession,
    { new: true, session },
  );
  return updatedGuestSession;
};

/**
 * Find one guest session
 * @param {object} filter - The filter object
 * @return {Promise<import('../models/guestSession.model').GuestSessionType>} - The guest session
 */
const findOne = async (filter) => {
  const guestSession = await GuestSession.findOne(filter);
  return guestSession;
};

module.exports = { create, getById, update, findOne };
