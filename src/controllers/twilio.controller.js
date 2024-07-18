const { z } = require("zod");
const twilioService = require("../services/twilio.service");
const querystring = require("querystring");
const { phoneregex } = require("../constants/regex.constant");

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
    console.log(phoneregex.test(phoneNumber));
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
    console.log(boughtPhoneNumber);
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
