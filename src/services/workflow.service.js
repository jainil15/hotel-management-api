const homeFlowService = require("./homeFlow.service");
const addOnsFlowService = require("./addOnsFlow.service");
const preArrivalFlowService = require("./preArrivalFlow.service");

const createDefaults = (propertyId, session) => {
  const homeFlow = homeFlowService.createDefaults(propertyId, session);
  const addOnsFlow = addOnsFlowService.createDefaults(propertyId, session);
  const preArrivalFlow = preArrivalFlowService.createDefaults(
    propertyId,
    session,
  );
  return { homeFlow, addOnsFlow, preArrivalFlow };
};

module.exports = {
  createDefaults,
};
