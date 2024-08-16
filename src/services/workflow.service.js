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

module.exports = {
  createDefaults,
  removeDefaults,
};
