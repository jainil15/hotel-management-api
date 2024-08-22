const { CheckedOutFlow } = require("../models/checkedOutFlow.model");

/**
 *  Create a new CheckedOutFlow
 *  @param {string} propertyId - The property id
 *  @param {object} checkedOutFlow - The checkedOutFlow object
 *  @param {object} session - The mongoose session
 *  @returns {Promise<import('../models/checkedOutFlow.model').CheckedOutFlowType>} - The saved CheckedOutFlow
 */
const create = async (propertyId, checkedOutFlow, session) => {
  const newCheckedOutFlow = new CheckedOutFlow({
    ...checkedOutFlow,
    propertyId,
  });
  const savedCheckedOutFlow = await newCheckedOutFlow.save({ session });
  return savedCheckedOutFlow;
};

/**
 * Get CheckedOutFlow by propertyId
 * @param {string} propertyId - The propertyId to filter CheckedOutFlow
 * @returns {Promise<import('../models/checkedOutFlow.model').CheckedOutFlowType>} - The CheckedOutFlow
 */
const getByPropertyId = async (propertyId) => {
  const checkedOutFlow = await CheckedOutFlow.findOne({ propertyId });
  return checkedOutFlow;
};

/**
 * Update CheckedOutFlow
 * @param {string} propertyId - The propertyId to filter CheckedOutFlow
 * @param {object} checkedOutFlow - The checkedOutFlow object
 * @returns {Promise<import('../models/checkedOutFlow.model').CheckedOutFlowType>} - The updated CheckedOutFlow
 */
const update = async (propertyId, checkedOutFlow) => {
  const updatedCheckedOutFlow = await CheckedOutFlow.findOneAndUpdate(
    { propertyId },
    checkedOutFlow,
    { new: true },
  );

  return updatedCheckedOutFlow;
};

/**
 * Remove CheckedOutFlow by propertyId
 * @param {string} propertyId - The propertyId to filter CheckedOutFlow
 * @returns {Promise<import('../models/checkedOutFlow.model').CheckedOutFlowType>} - The CheckedOutFlow
 */
const remove = async (propertyId) => {
  const checkedOutFlow = await CheckedOutFlow.findOneAndDelete({ propertyId });

  return checkedOutFlow;
};

module.exports = { create, getByPropertyId, update, remove };
