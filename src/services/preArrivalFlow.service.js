const { PreArrivalFlow } = require("../models/preArrivalFlow.model");

/**
 * Create a default pre arrival flow
 * @param {string} propertyId - The propertyId to filter pre arrival flows
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/preArrivalFlow.model').PreArrivalFlowType>} - The new pre arrival flow
 */
const createDefault = async (propertyId, session) => {
  const defaultPreArrivalFlow = new PreArrivalFlow({
    propertyId: propertyId,
  });
  await defaultPreArrivalFlow.save({ session: session });
  return defaultPreArrivalFlow;
};

/**
 * Create a new pre arrival flow
 * @param {string} propertyId - The propertyId to filter pre arrival flows
 * @param {import('../models/preArrivalFlow.model').PreArrivalFlowType} preArrivalFlow - The pre arrival flow object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/preArrivalFlow.model').PreArrivalFlowType>} - The new pre arrival flow
 */
const create = async (propertyId, preArrivalFlow, session) => {
  const newPreArrivalFlow = new PreArrivalFlow({
    ...preArrivalFlow,
    propertyId: propertyId,
  });
  await newPreArrivalFlow.save({ session: session });
  return newPreArrivalFlow;
};

/**
 * Update a pre arrival flow
 * @param {string} propertyId - The propertyId to filter pre arrival flows
 * @param {import('../models/preArrivalFlow.model').PreArrivalFlowType} preArrivalFlow - The pre arrival flow object
 * @param {object} session - The mongoose session
 * @returns {Promise<import('../models/preArrivalFlow.model').PreArrivalFlowType>} - The updated pre arrival flow
 */
const update = async (propertyId, preArrivalFlow, session) => {
  const updatedPreArrivalFlow = await PreArrivalFlow.findOneAndUpdate(
    { propertyId: propertyId },
    preArrivalFlow,
    { new: true, session: session },
  );
  return updatedPreArrivalFlow;
};

/**
 * Get pre arrival flow by property id
 * @param {string} propertyId - The propertyId to filter pre arrival flows
 * @returns {Promise<import('../models/preArrivalFlow.model').PreArrivalFlowType>} - The pre arrival flow
 */
const getByPropertyId = async (propertyId) => {
  const preArrivalFlow = await PreArrivalFlow.findOne({ propertyId });
  return preArrivalFlow;
};

/**
 * Remove a pre arrival flow
 * @param {string} propertyId - The propertyId to filter pre arrival flows
 * @param {object} session - The mongoose session
 * @returns {Promise<void>}
 */
const remove = async (propertyId, session) => {
  await PreArrivalFlow.deleteOne({ propertyId }, { session: session });
};
module.exports = { createDefault, create, update, remove, getByPropertyId };
