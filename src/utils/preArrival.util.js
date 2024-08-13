const ignoreKeys = [
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "guestId",
  "propertyId",
  "policies",
  "policyLink",
  "extraPolicies",
];

/**
 * @param {import('../models/preArrivalFlow.model').PreArrivalFlowType} preArrivalFlow
 * @param {import('../models/preArrival.model').PreArrivalType} preArrival
 * @returns {boolean}
 */
const validatePreArrivalFlow = (preArrivalFlow, preArrival) => {
  const preArrivalFlowKeys = Object.keys(preArrivalFlow);
  const preArrivalKeys = Object.keys(preArrival);
  for (const key of preArrivalFlowKeys) {
    if (ignoreKeys.includes(key)) {
      continue;
    }
    if (preArrivalFlow[key] && !preArrival[key]) {
      console.log(key, preArrivalFlow[key], preArrival[key]);
      return false;
    }
    if (!preArrivalFlow[key] && preArrival[key]) {
      console.log(key, preArrivalFlow[key], preArrival[key]);
      return false;
    }
  }
  return true;
};

module.exports = { validatePreArrivalFlow };
