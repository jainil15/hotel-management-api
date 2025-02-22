const { NotFoundError } = require("../lib/CustomErrors");
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
 * Update twilio account
 * @param {string} propertyId - The propertyId to filter twilio account
 * @param {object} twilioAccount - The twilio account to update
 * @returns {Promise<TwilioAccount>} - The updated twilio account
 */
const update = async (propertyId, twilioAccount) => {
  const updatedTwilioAccount = await TwilioAccount.findOneAndUpdate(
    { propertyId: propertyId },
    twilioAccount,
    { new: true },
  );
  if (!updatedTwilioAccount) {
    throw new NotFoundError("Twilio account not found");
  }
  return updatedTwilioAccount;
};

/**
 * Find twilio account
 * @param {object} filter - The query to filter twilio account
 * @returns {Promise<TwilioAccount>} - The list of twilio account
 */
const findOne = async (filter) => {
  return await TwilioAccount.findOne(filter);
};

module.exports = { getByPropertyId, findOne, update };
