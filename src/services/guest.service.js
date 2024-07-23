const { Guest } = require("../models/guest.model");

const create = async (guest, propertyId) => {
  const newGuest = new Guest({ ...guest, propertyId: propertyId });
  const savedGuest = await newGuest.save();
  return savedGuest;
};

const getAll = async (propertyId) => {
  const guests = await Guest.find({ propertyId: propertyId });
  return guests;
};

const getById = async (guestId, propertyId) => {
  const guest = await Guest.findOne({ _id: guestId, propertyId: propertyId });
  if (!guest) {
    throw new Error("Guest not found");
  }
  return guest;
};

const update = async (guest, propertyId) => {
  const updatedGuest = await Guest.findOneAndUpdate({
    ...guest,
    propertyId: propertyId,
  });
  if (!updatedGuest) {
    throw new Error("Guest not found");
  }
  return updatedGuest;
};

const remove = async (guestId, propertyId) => {
  const removedGuest = await Guest.findOneAndDelete({
    _id: guestId,
    propertyId: propertyId,
  });
  if (!removedGuest) {
    throw new Error("Guest not found");
  }
  return removedGuest;
};

module.exports = { create, getAll, getById, update, remove };
