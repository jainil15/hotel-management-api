const { Guest } = require("../models/guest.model");

const create = async (guest, propertyId) => {
  try {
    const newGuest = new Guest({ ...guest, propertyId: propertyId });
    const savedGuest = await newGuest.save();
    return savedGuest;
  } catch (e) {
    throw new Error("Error creating guest" + e);
  }
};

const getAll = async (propertyId) => {
  try {
    const guests = await Guest.find({ propertyId: propertyId });
    return guests;
  } catch (e) {
    throw new Error("Error getting guests" + e);
  }
};

const getById = async (guestId, propertyId) => {
  try {
    const guest = await Guest.findOne({ _id: guestId, propertyId: propertyId });
    if (!guest) {
      throw new Error("Guest not found");
    }
    return guest;
  } catch (e) {
    throw new Error("Error getting guest" + e);
  }
};

const update = async (guest, propertyId) => {
  try {
    const updatedGuest = await Guest.findOneAndUpdate({
      ...guest,
      propertyId: propertyId,
    });
    if (!updatedGuest) {
      throw new Error("Guest not found");
    }
    return updatedGuest;
  } catch (e) {
    throw new Error("Error updating guest" + e);
  }
};

const remove = async (guestId, propertyId) => {
  try {
    const removedGuest = await Guest.findOneAndDelete({
      _id: guestId,
      propertyId: propertyId,
    });
    if (!removedGuest) {
      throw new Error("Guest not found");
    }
    return removedGuest;
  } catch (e) {
    throw new Error("Error deleting guest " + e);
  }
};

module.exports = { create, getAll, getById, update, remove };
