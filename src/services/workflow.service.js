const homeFlowService = require("./homeFlow.service");
const addOnsFlowService = require("./addOnsFlow.service");
const preArrivalFlowService = require("./preArrivalFlow.service");

/**
 * Create default workflows for a property
 * @param {string} propertyId
 * @param {import("mongoose").ClientSession} session
 * @returns {Promise<{homeFlow: HomeFlow, addOnsFlow: AddOnsFlow, preArrivalFlow: PreArrivalFlow}>}
 */
const createDefaults = async (propertyId, session) => {
  const homeFlow = await homeFlowService.create(propertyId, {}, session);
  const addOnsFlow = await addOnsFlowService.create(propertyId, {}, session);
  const preArrivalFlow = await preArrivalFlowService.create(
    propertyId,
    {},
    session,
  );
  return { homeFlow, addOnsFlow, preArrivalFlow };
};

module.exports = {
  createDefaults,
};
