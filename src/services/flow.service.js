const { Flow } = require("../models/flow.model");

/**
 * Get all flows by property id
 * @param {string} propertyId - property id
 * @returns {Promise<import('../models/flow.model').FlowType[]>} - flows
 */
const getAllByPropertyId = async (propertyId) => {
  const flows = await Flow.find({ propertyId });
  return flows;
};

/**
 * Get flow by property id and flow name
 * @param {string} propertyId - property id
 * @param {string} name - flow name
 * @returns {Promise<import('../models/flow.model').FlowType>} - flow
 */
const getByName = async (propertyId, name) => {
  const flow = await Flow.findOne({
    propertyId,
    name,
  });
  return flow;
};

/**
 * Get flow by id
 * @param {string} flowId - flow id
 * @returns {Promise<import('../models/flow.model').FlowType>} - flow
 */
const getById = async (flowId) => {
  const flow = await Flow.findById(flowId);
  return flow;
};

/**
 * Create flow
 * @param {string} propertyId - property id
 * @param {import('../models/flow.model').FlowType} flow - flow
 * @param {import('mongoose').ClientSession} session - transaction session
 * @returns {Promise<import('../models/flow.model').FlowType>} - created flow
 */
const create = async (propertyId, flow, session) => {
  const newFlow = new Flow({
    propertyId,
    ...flow,
  });
  await newFlow.save({ session });
  return newFlow;
};

/**
 * Find flow
 * @param {Object} filter - filter
 * @returns {Promise<import('../models/flow.model').FlowType>} - flow
 */
const findOne = async (filter) => {
  const flow = await Flow.findOne(filter);
  return flow;
};

/**
 * Update flow
 * @param {string} flowId - flow id
 * @param {import('../models/flow.model').FlowType} flow - flow
 * @param {import('mongoose').ClientSession} session - transaction session
 * @returns {Promise<import('../models/flow.model').FlowType>} - updated flow
 */
const update = async (flowId, flow, session) => {
  const updatedFlow = await Flow.findByIdAndUpdate(
    flowId,
    { ...flow },
    { new: true, session: session },
  );
  return updatedFlow;
};

module.exports = {
  getAllByPropertyId,
  getByName,
  getById,
  create,
  findOne,
  update,
};
