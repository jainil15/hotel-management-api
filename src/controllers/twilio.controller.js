const { z } = require("zod");
const twilioService = require("../services/twilio.service");
const querystring = require("querystring");
const { phoneregex } = require("../constants/regex.constant");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");

const getPhoneNumbers = async (req, res) => {
  try {
    const country = req.query.country;
    const allPhoneNumbers = await twilioService.getPhoneNumbers(country);
    const phoneNumbers = allPhoneNumbers.map((phoneNumber) => ({
      phoneNumber: phoneNumber.phone_number,
      friendlyName: phoneNumber.friendly_name,
    }));
    return res.status(200).json({ result: { phoneNumbers: phoneNumbers } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const buyPhoneNumber = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const phoneNumber = req.body.phoneNumber;
    
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
    const result = z
      .object({
        phoneNumber: z.string().refine((val) => phoneregex.test(val), {
          message: "Invalid phone number format",
        }),
      })
      .safeParse({ phoneNumber });
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    const boughtPhoneNumber = await twilioService.buyPhoneNumber(
      propertyId,
      phoneNumber
    );
    
    return res
      .status(200)
      .json({ result: { message: "Successfully bought phonenumber" } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

const createSubaccount = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      return res
        .status(400)
        .json({ error: { propertyId: "PropertyId is required" } });
    }
    const subaccount = await twilioService.createSubaccount(propertyId);
    return res
      .status(200)
      .json({ result: { message: "Twilio subaccount Created" } });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

module.exports = { getPhoneNumbers, buyPhoneNumber, createSubaccount };
