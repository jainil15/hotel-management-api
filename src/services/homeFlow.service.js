const { HomeFlow } = require("../models/homeFlow.model");

/**
 * Get home flow by property id
 * @param {string} propertyId - property id
 * @returns {Promise<HomeFlowType>} - home flow
 */
const getByPropertyId = async (propertyId) => {
  const homeFlow = await HomeFlow.findOne({ propertyId });
  return homeFlow;
};

/**
 * Create home flow
 * @param {string} propertyId - property id
 * @param {import('../models/homeFlow.model').HomeFlowType} homeFlow - home flow
 * @param {import('mongoose').ClientSession} session - transaction session
 * @returns {Promise<import('../models/homeFlow.model').HomeFlowType>} - created home flow
 */
const create = async (propertyId, homeFlow, session) => {
  const newHomeFlow = new HomeFlow({
    propertyId,
    ...homeFlow,
  });
  await newHomeFlow.save({ session });
  return newHomeFlow;
};

/**
 * Update home flow
 * @param {string} propertyId - property id
 * @param {import('../models/homeFlow.model').HomeFlowType} homeFlow - home flow
 * @param {import('mongoose').ClientSession} session - transaction session
 * @returns {Promise<import('../models/homeFlow.model').HomeFlowType>} - updated home flow
 */
const update = async (propertyId, homeFlow, session) => {
  const updatedHomeFlow = await HomeFlow.findOneAndUpdate(
    { propertyId },
    { ...homeFlow },
    { new: true, session: session },
  );
  return updatedHomeFlow;
};

const remove = async (propertyId, session) => {
  await HomeFlow.deleteOne({ propertyId }, { session: session });
};

module.exports = {
  getByPropertyId,
  create,
  update,
  remove,
};
