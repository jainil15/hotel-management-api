const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const { default: axios } = require("axios");
const twilio = require("twilio");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");
const twilioClient = twilio(accountSid, authToken);

const getPhoneNumbers = async (country) => {
  try {
    const response = await twilioClient.availablePhoneNumbers(country).fetch();
    const phoneNumbers = await axios.get(
      `https://api.twilio.com/${response.subresourceUris.local}`,
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
        phoneNumber.capabilities.MMS === true
    );
  } catch (e) {
    throw new Error("Error getting phone numbers: " + e);
  }
};

const buyPhoneNumber = async (propertyId, phoneNumber) => {
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
    console.log(incomingPhoneNumber);
    const response = twilioClient
      .incomingPhoneNumbers(incomingPhoneNumber.sid)
      .update({ accountSid: twilioAccount.sid });

    twilioAccount.phoneNumber = incomingPhoneNumber.phoneNumber;
    twilioAccount.phoneNumberSid = incomingPhoneNumber.sid;
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

module.exports = { getPhoneNumbers, buyPhoneNumber, createSubaccount };
