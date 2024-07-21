const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const { default: axios } = require("axios");
const twilio = require("twilio");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");
const twilioClient = twilio(accountSid, authToken);
const countryFile = require("../data/country.json");
const { getCountryIso2 } = require("../utils/country.util");

const getPhoneNumbers = async (country) => {
  try {
    const response = await twilioClient.availablePhoneNumbers(country).fetch();
    const phoneNumbers = await axios.get(
      `https://api.twilio.com/${response.subresourceUris.toll_free}`,
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
      }
    );

    return phoneNumbers.data.available_phone_numbers.filter(
      (phoneNumber) =>
        phoneNumber.capabilities.voice === true &&
        phoneNumber.capabilities.SMS === true &&
        phoneNumber.capabilities.MMS === true &&
        phoneNumber.address_requirements === "none"
    );
  } catch (e) {
    throw new Error("Error getting phone numbers: " + e);
  }
};

const buyPhoneNumber = async (propertyId, phoneNumber, user) => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }
    // Check if property exists
    const twilioAccount = await TwilioAccount.findOne({
      propertyId: propertyId,
    });
    if (!twilioAccount) {
      throw new Error("Twilio Account not found");
    }
    // Check if Twilio Account already has a phone number
    if (twilioAccount.phoneNumber) {
      throw new Error("Twilio Account already has a phone number");
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
        optInImageUrls: [
          "https://onelyk-docs.s3.amazonaws.com/verbal_optin.txt",
        ],
        productionMessageSample:
          "Hello, You're early checkin is approved. Use the link provided to see next steps.",
        tollfreePhoneNumberSid: incomingPhoneNumber.sid,
        useCaseCategories: ["CUSTOMER_CARE"],
        useCaseSummary: "Communication with guest for hotel front desk",
      });
    twilioAccount.phoneNumber = incomingPhoneNumber.phoneNumber;
    twilioAccount.phoneNumberSid = incomingPhoneNumber.sid;
    twilioAccount.tollfreeVerificationSid = tollfreeVerification.sid;
    await twilioAccount.save();
    return incomingPhoneNumber;
  } catch (e) {
    throw new Error("Error buying phone number: " + e);
  }
};

const createSubaccount = async (propertyId) => {
  try {
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }
    // Check if Twilio Account already exists
    const oldTwilioAccount = await TwilioAccount.findOne({
      propertyId: propertyId,
    });
    if (oldTwilioAccount) {
      throw new Error("Twilio Account already exists");
    }
    // Create Twilio Subaccount
    const twilioPropertySubaccount =
      await twilioClient.api.v2010.accounts.create({
        friendlyName: property.name,
      });
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
  } catch (e) {
    throw new Error("Error creating subaccount: " + e);
  }
};

const getTollFreeVerificationStatus = async (propertyId) => {
  // Check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new Error("Property not found");
  }
  // Check if twilio account exists
  const twilioAccount = await TwilioAccount.findOne({
    propertyId: propertyId,
  });
  if (!twilioAccount) {
    throw new Error("Twilio Account not found");
  }
  // Get toll free verification status
  const tollfreeVerification =
    await twilioClient.messaging.v1.tollfreeVerifications(twilioAccount.tollfreeVerificationSid).fetch();
  return tollfreeVerification.status;
};

module.exports = {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
  getTollFreeVerificationStatus,
};
