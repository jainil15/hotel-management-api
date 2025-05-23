const { InHouseFlow } = require("../models/inHouseFlow.model");

/**
 * Create a new InHouseFlow
 * @param {string} propertyId - The property id
 * @param {import('../models/inHouseFlow.model').InHouseFlowType} inHouseFlow - The inHouseFlow object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/inHouseFlow.model').InHouseFlowType>} - The saved InHouseFlow
 */
const create = async (propertyId, inHouseFlow, session) => {
  const newInHouseFlow = new InHouseFlow({ ...inHouseFlow, propertyId });
  const savedInHouseFlow = await newInHouseFlow.save({ session });
  return savedInHouseFlow;
};

/**
 * Get InHouseFlow by propertyId
 * @param {string} propertyId - The propertyId to filter InHouseFlow
 * @returns {Promise<import('../models/inHouseFlow.model').InHouseFlowType>} - The InHouseFlow
 */
const getByPropertyId = async (propertyId) => {
  const inHouseFlow = await InHouseFlow.findOne({ propertyId });
  return inHouseFlow;
};

/**
 * Update InHouseFlow
 * @param {string} propertyId - The propertyId to filter InHouseFlow
 * @param {import('../models/inHouseFlow.model').InHouseFlowType} inHouseFlow - The inHouseFlow object
 * @returns {Promise<import('../models/inHouseFlow.model').InHouseFlowType>} - The updated InHouseFlow
 */
const update = async (propertyId, inHouseFlow) => {
  const updatedInHouseFlow = await InHouseFlow.findOneAndUpdate(
    { propertyId },
    inHouseFlow,
    { new: true },
  );
  return updatedInHouseFlow;
};

/**
 * Remove InHouseFlow by propertyId
 * @param {string} propertyId - The propertyId to filter InHouseFlow
 * @returns {Promise<import('../models/inHouseFlow.model').InHouseFlowType>} - The InHouseFlow
 */
const remove = async (propertyId) => {
  const inHouseFlow = await InHouseFlow.findOneAndDelete({ propertyId });
  return inHouseFlow;
};

module.exports = { create, getByPropertyId, update, remove };
