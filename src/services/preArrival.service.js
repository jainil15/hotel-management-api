const { PreArrival } = require("../models/preArrival.model");
/**
 * Create a new pre arrival
 * @param {string} propertyId - The property id
 * @param {string} guestId - The guest id
 * @param {object} preArrival - The pre arrival object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/preArrival.model').PreArrivalType>} - The new pre arrival
 */
const create = async (propertyId, guestId, preArrival, session) => {
  const newPreArrival = new PreArrival({
    guestId,
    propertyId,
    ...preArrival,
  });
  await newPreArrival.save({ session: session });
  return newPreArrival;
};

const getById = async (preArrivalId) => {
  const preArrival = await PreArrival.findById(preArrivalId);
  return preArrival;
};

const getByPropertyId = async (propertyId) => {
  const preArrivals = await PreArrival.find({ propertyId });
  return preArrivals;
};

const getByGuestId = (guestId) => {
  const preArrival = PreArrival.findOne({ guestId });
  return preArrival;
};

const update = async (preArrivalId, preArrival, session) => {
  const updatedPreArrival = await PreArrival.findByIdAndUpdate(
    preArrivalId,
    preArrival,
    { new: true, session: session },
  );
  return updatedPreArrival;
};

const remove = async (preArrivalId, session) => {
  const preArrival = await PreArrival.findByIdAndDelete(preArrivalId, {
    session: session,
  });

  return preArrival;
};

module.exports = {
  create,
  getById,
  getByGuestId,
  update,
  remove,
  getByPropertyId,
};
