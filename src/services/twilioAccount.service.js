const { TwilioAccount } = require("../models/twilioAccount.model");

/**
 * Get twilio account by propertyId
 * @param {string} propertyId - The propertyId to filter twilio account
 * @returns {Promise<TwilioAccount>} - The twilio account
 */
const getByPropertyId = async (propertyId) => {
  const twilioAccount = await TwilioAccount.findOne({ propertyId: propertyId });
  return twilioAccount;
};

/**
 * Find twilio account
 * @param {object} filter - The query to filter twilio account
 * @returns {Promise<TwilioAccount>} - The list of twilio account
 */
const findOne = async (filter) => {
  return await TwilioAccount.findOne(filter);
};

module.exports = { getByPropertyId, findOne };
