const {
  CreatePreArrivalValidationSchema,
} = require("../models/preArrival.model");
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
  "primaryPolicy",
];

const ignoreOptionalKeys = ["specialRequests"];

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
      return {
        key,
        preArrivalFlow: preArrivalFlow[key],
        preArrival: preArrival[key],
        success: false,
      };
    }
    if (!preArrivalFlow[key] && preArrival[key]) {
      console.log(key, preArrivalFlow[key], preArrival[key]);
      return {
        key,
        preArrivalFlow: preArrivalFlow[key],
        preArrival: preArrival[key],
        success: false,
      };
    }
  }
  return { success: true };
};

/**
 * @param {import('../models/preArrivalFlow.model').PreArrivalFlowType} preArrivalFlow
 * @param {import('../models/preArrival.model').PreArrivalType} preArrival
 * @returns {import('zod').ZodParsedType<import('../models/preArrival.model').PreArrivalType>}
 */
const zodValidatePreArrivalFlow = (preArrivalFlow, preArrival) => {
  const result = CreatePreArrivalValidationSchema.superRefine((args, ctx) => {
    const preArrivalFlowKeys = Object.keys(preArrivalFlow);
    const preArrivalKeys = Object.keys(preArrival);
    for (const key of preArrivalFlowKeys) {
      if (ignoreKeys.includes(key)) {
        continue;
      }
      if (!preArrivalFlow[key] && preArrival[key]) {
        ctx.addIssue({
          code: "invalid",
          message: `${key} is not required`,
          path: [key],
        });
      }
      // if (ignoreOptionalKeys.includes(key)) {
      //   continue;
      // }
      if (preArrivalFlow[key] && !preArrival[key]) {
        ctx.addIssue({
          code: "invalid",
          message: `${key} is required`,
          path: [key],
        });
      }
    }
  }).safeParse(preArrival);
  return result;
};

module.exports = { validatePreArrivalFlow, zodValidatePreArrivalFlow };
