const { TwilioAccount } = require("../models/twilioAccount.model");

const getByPropertyId = async (propertyId) => {
  const twilioAccount = await TwilioAccount.findOne({ propertyId: propertyId });
  return twilioAccount;
};

module.exports = { getByPropertyId };
