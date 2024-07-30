const { PreArrival } = require("../models/preArrival.model");

const create = async (guestId, propertyId, preArrival, session) => {
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
    { new: true, session: session }
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
};
