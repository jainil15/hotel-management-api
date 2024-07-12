const mongoose = require("mongoose");
const FeatureAccess = require("../models/featureaccess.model");
const { Property } = require("../models/property.model");
const PropertyAccess = require("../models/propertyaccess.model");

const create = async (property, user) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();
  try {
    
    const newProperty = new Property({ ...property });

    const newPropertyAcess = new PropertyAccess({
      propertyId: newProperty._id,
      userId: user._id,
      role: user.role,
    });
    // add { session }
    await newPropertyAcess.save();
    const savedProperty = await newProperty.save();
    // await session.commitTransaction();
    // session.endSession();
    return savedProperty;
  } catch (e) {
    // await session.abortTransaction();
    // session.endSession();
    throw new Error("Error creating property" + e);
  }
};

const getAll = async (user) => {
  try {
    const properties = await PropertyAccess.find({ userId: user._id });
    return properties;
  } catch (e) {
    throw new Error("Error getting properties" + e);
  }
};

const update = async (property, propertyId) => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      property,
      { new: true }
    );
    return updatedProperty;
  } catch (e) {
    throw new Error("Error updating property" + e);
  }
};

const remove = async (propertyId) => {
  try {
    const removedProperty = await Property.findByIdAndDelete(propertyId);
    const _propertyAccess = await PropertyAccess.findOneAndDelete({
      propertyId: propertyId,
    });
    return removedProperty;
  } catch (e) {
    throw new Error("Error deleting property " + e);
  }
};

const getById = async (propertyId) => {
  try {
    console.log(propertyId);
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }
    return property;
  } catch (e) {
    throw new Error("Error getting property by id" + e);
  }
};

module.exports = { create, getAll, update, remove, getById };
