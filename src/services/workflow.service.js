const homeFlowService = require("./homeFlow.service");
const addOnsFlowService = require("./addOnsFlow.service");
const preArrivalFlowService = require("./preArrivalFlow.service");
const inHouseFlowService = require("./inHouseFlow.service");
const checkedOutFlowService = require("./checkedOutFlow.service");
/**
 * Create default workflows for a property
 * @param {string} propertyId
 * @param {import("mongoose").ClientSession} session
 * @returns {Promise<{
 * homeFlow: import('../models/homeFlow.model').HomeFlowType,
 * addOnsFlow: import('../models/addOnsFlow.model').AddOnsFlowType,
 * preArrivalFlow: import('../models/preArrivalFlow.model').PreArrivalFlowType,
 * inHouseFlow: import('../models/inHouseFlow.model').InHouseFlowType,
 * checkedOutFlow: import('../models/checkedOutFlow.model').CheckedOutFlowType
 * }>} - The default
 */
const createDefaults = async (propertyId, session) => {
  const homeFlow = await homeFlowService.create(propertyId, {}, session);
  const addOnsFlow = await addOnsFlowService.create(propertyId, {}, session);
  const preArrivalFlow = await preArrivalFlowService.create(
    propertyId,
    {},
    session,
  );
  const inHouseFlow = await inHouseFlowService.create(propertyId, {}, session);
  const checkedOutFlow = await checkedOutFlowService.create(
    propertyId,
    {},
    session,
  );
  return { homeFlow, addOnsFlow, preArrivalFlow, inHouseFlow, checkedOutFlow };
};

const removeDefaults = async (propertyId, session) => {
  await homeFlowService.remove(propertyId, session);
  await addOnsFlowService.remove(propertyId, session);
  await preArrivalFlowService.remove(propertyId, session);
  await inHouseFlowService.remove(propertyId, session);
  await checkedOutFlowService.remove(propertyId, session);
};

/**
 * Get all workflows for a property
 * @param {string} propertyId
 * @returns {Promise<import('../models/workflow.model').WorkflowType>} - The workflow
 */
const getByPropertyId = async (propertyId) => {
  const homeFlow = await homeFlowService.getByPropertyId(propertyId);
  const addOnsFlow = await addOnsFlowService.getByPropertyId(propertyId);
  const preArrivalFlow =
    await preArrivalFlowService.getByPropertyId(propertyId);
  const inHouseFlow = await inHouseFlowService.getByPropertyId(propertyId);
  const checkedOutFlow =
    await checkedOutFlowService.getByPropertyId(propertyId);
  return { homeFlow, addOnsFlow, preArrivalFlow, inHouseFlow, checkedOutFlow };
};

const update = async (propertyId, workflow, session) => {
  const homeFlow = await homeFlowService.update(
    propertyId,
    workflow.homeFlow,
    session,
  );
  const addOnsFlow = await addOnsFlowService.update(
    propertyId,
    workflow.addOnsFlow,
    session,
  );
  const preArrivalFlow = await preArrivalFlowService.update(
    propertyId,
    workflow.preArrivalFlow,
    session,
  );
  const inHouseFlow = await inHouseFlowService.update(
    propertyId,
    workflow.inHouseFlow,
    session,
  );
  const checkedOutFlow = await checkedOutFlowService.update(
    propertyId,
    workflow.checkedOutFlow,
    session,
  );
  return { homeFlow, addOnsFlow, preArrivalFlow, inHouseFlow, checkedOutFlow };
};

module.exports = {
  createDefaults,
  removeDefaults,
  getByPropertyId,
};
