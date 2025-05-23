const PropertyAccess = require("../models/propertyaccess.model");

/**
 * Create a new property access
 * @param {string} userId - The guest id
 * @param {string} propertyId - The property id
 * @param {string} role - The role of the guest
 * @returns {Promise<PropertyAccess>} - The new property access
 */
const create = async (userId, propertyId, role) => {
  const newPropertyAccess = new PropertyAccess({
    propertyId: propertyId,
    userId: userId,
  });
  return newPropertyAccess;
};

/**
 * Get property access by userId
 * @param {string} userId - The userId to filter property access
 * @returns {Promise<PropertyAccess[]>} - The list of property access
 */
const getByUserId = async (userId) => {
  const propertyAccess = await PropertyAccess.find({ userId: userId });
  return propertyAccess;
};

/**
 * Get property access by propertyId
 * @param {string} propertyId - The propertyId to filter property access
 * @returns {Promise<PropertyAccess[]>} - The list of property access
 */
const getByPropertyId = async (propertyId) => {
  const propertyAccess = await PropertyAccess.find({ propertyId: propertyId });
  return propertyAccess;
};

/**
 * Get property access by propertyId and userId
 * @param {string} propertyId - The propertyId to filter property access
 * @param {string} userId - The userId to filter property access
 * @returns {Promise<PropertyAccess>} - The property access
 */
const getByPropertyIdAndUserId = async (propertyId, userId) => {
  const propertyAccess = await PropertyAccess.findOne({
    propertyId: propertyId,
    userId: userId,
  });
  return propertyAccess;
};

module.exports = {
  create,
  getByUserId,
  getByPropertyId,
  getByPropertyIdAndUserId,
};
