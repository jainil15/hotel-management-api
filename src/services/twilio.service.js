const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const { default: axios } = require("axios");
const twilio = require("twilio");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");
const twilioClient = twilio(accountSid, authToken);
const countryFile = require("../data/country.json");
const { getCountryIso2 } = require("../utils/country.util");
const { NotFoundError, ConflictError } = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const { Message } = require("../models/message.model");

const getPhoneNumbers = async (country) => {
  const response = await twilioClient.availablePhoneNumbers(country).fetch();
  const phoneNumbers = await axios.get(
    `https://api.twilio.com/${response.subresourceUris.toll_free}?SMSEnabled=true&VoiceEnabled=true`,
    {
      auth: {
        username: accountSid,
        password: authToken,
      },
    },
  );
  return phoneNumbers.data.available_phone_numbers;
};

const buyPhoneNumber = async (propertyId, phoneNumber, user) => {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError("Property not found", {
      propertyId: ["Property not found for the given id"],
    });
  }
  // Check if property exists
  const twilioAccount = await TwilioAccount.findOne({
    propertyId: propertyId,
  });
  if (!twilioAccount) {
    throw new NotFoundError("Twilio Account not found", {
      propertyId: ["Twilio account found for the given property id"],
    });
  }
  // Check if Twilio Account already has a phone number
  if (twilioAccount.phoneNumber) {
    throw new ConflictError("Twilio Account already has a phone number", {
      phoneNumber: ["Twilio Account already has a phone number"],
    });
  }

  // Buy phone number
  const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: phoneNumber,
    smsMethod: "POST",
    smsUrl: process.env.TWILIO_SMS_URL,
    voiceMethod: "POST",
    voiceUrl: process.env.TWILIO_VOICE_URL,
    statusCallbackMethod: "POST",
    statusCallback: process.env.TWILIO_STATUS_CALLBACK,
  });

  // Transfer phone number to subaccount
  const response = twilioClient
    .incomingPhoneNumbers(incomingPhoneNumber.sid)
    .update({ accountSid: twilioAccount.sid });

  // toll free verification
  const tollfreeVerification =
    await twilioClient.messaging.v1.tollfreeVerifications.create({
      businessCity: property.city,
      businessContactEmail: property.email,
      businessContactFirstName: user.firstName,
      businessContactLastName: user.lastName,
      businessContactPhone: property.phoneNumber,
      businessCountry: getCountryIso2(property.country),
      businessName: property.name,
      businessPostalCode: property.zipcode,
      businessStateProvinceRegion: property.state,
      businessStreetAddress: property.address,
      businessWebsite: property.website,
      messageVolume: "1,000",
      notificationEmail: property.email,
      optInType: "VERBAL",
      optInImageUrls: ["https://onelyk-docs.s3.amazonaws.com/verbal_optin.txt"],
      productionMessageSample:
        "Hello, You're early checkin is approved. Use the link provided to see next steps.",
      tollfreePhoneNumberSid: incomingPhoneNumber.sid,
      useCaseCategories: ["CUSTOMER_CARE"],
      useCaseSummary: "Communication with guest for hotel front desk",
    });
  twilioAccount.phoneNumber = incomingPhoneNumber.phoneNumber.slice(-10);
  twilioAccount.countryCode = incomingPhoneNumber.phoneNumber.slice(
    0,
    incomingPhoneNumber.phoneNumber.length - 10,
  );
  twilioAccount.phoneNumberSid = incomingPhoneNumber.sid;
  twilioAccount.tollfreeVerificationSid = tollfreeVerification.sid;
  await twilioAccount.save();
  return incomingPhoneNumber;
};

const createSubaccount = async (propertyId) => {
  // Check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError("Property not found", {
      propertyId: ["Property not found for the given id"],
    });
  }
  // Check if Twilio Account already exists
  const oldTwilioAccount = await TwilioAccount.findOne({
    propertyId: propertyId,
  });
  if (oldTwilioAccount) {
    throw new ConflictError("Twilio Account already exists", {});
  }
  // Create Twilio Subaccount
  const twilioPropertySubaccount = await twilioClient.api.v2010.accounts.create(
    {
      friendlyName: propertyId,
    },
  );
  // Create Twilio Account
  const newTwilioAccount = new TwilioAccount({
    propertyId: property._id,
    authToken: twilioPropertySubaccount.authToken,
    sid: twilioPropertySubaccount.sid,
    dateCreated: twilioPropertySubaccount.dateCreated,
    dateUpdated: twilioPropertySubaccount.dateUpdated,
    friendlyName: twilioPropertySubaccount.friendlyName,
    ownerAccountSid: twilioPropertySubaccount.ownerAccountSid,
    status: twilioPropertySubaccount.status,
  });
  await newTwilioAccount.save();
  return newTwilioAccount;
};

/**
 * Get toll free verification status
 * @param {string} propertyId - property id
 * @returns {string} status - toll free verification status
 */
const getTollFreeVerificationStatus = async (propertyId) => {
  // Check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new NotFoundError("Property not found", {
      propertyId: ["Property not found for the given id"],
    });
  }
  // Check if twilio account exists
  const twilioAccount = await TwilioAccount.findOne({
    propertyId: propertyId,
  });
  if (!twilioAccount) {
    throw new NotFoundError("Twilio Account not found", {
      propertyId: ["Twilio account found for the given property id"],
    });
  }
  // Get toll free verification status
  const tollfreeVerification = await twilioClient.messaging.v1
    .tollfreeVerifications(twilioAccount.tollfreeVerificationSid)
    .fetch();
  if (!tollfreeVerification.status) {
    throw new NotFoundError("Toll Free Verification not found", {
      propertyId: [
        "Toll Free Verification not found for the given property id",
      ],
    });
  }
  return tollfreeVerification.status;
};

const sendAccessLink = async (propertyId, guestPhoneNumber, body) => {
  const twilioAccount = await TwilioAccount.findOne({
    propertyId: propertyId,
  });
  const twilioSubClient = twilio(accountSid, authToken, {
    accountSid: twilioAccount.sid,
  });
  const message = await twilioSubClient.messages.create({
    body: body,
    from: `${twilioAccount.countryCode + twilioAccount.phoneNumber}`,
    to: guestPhoneNumber,
  });
  return message;
};

/**
 * Get subaccount billing
 * @param {object} client - twilio client object
 * @returns {object} messages - twilio messages object
 */
const subaccountBilling = async (client) => {
  const messages = await client.messages.list();
  const bill = messages.reduce((acc, message) => {
    return acc + Math.abs(Number(message.price));
  }, 0);
  return bill;
};

/**
 * Get twilio client
 * @param {object} twilioAccount - twilio account object
 * @returns {Promise<import('twilio').Twilio>} client - twilio client object
 */
const getTwilioClient = async (twilioAccount) => {
  const client = twilio(accountSid, authToken, {
    accountSid: twilioAccount.sid,
  });
  return client;
};

module.exports = {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
  getTollFreeVerificationStatus,
  sendAccessLink,
  subaccountBilling,
  getTwilioClient,
};
