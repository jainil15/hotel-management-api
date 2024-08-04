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

module.exports = { getByPropertyId };
