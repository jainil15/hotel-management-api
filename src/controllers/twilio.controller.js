const { z } = require("zod");
const twilioService = require("../services/twilio.service");
const querystring = require("querystring");
const { phoneregex } = require("../constants/regex.constant");
const { TwilioAccount } = require("../models/twilioAccount.model");
const { Property } = require("../models/property.model");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  NotFoundError,
  APIError,
  ValidationError,
  BadRequestError,
  InternalServerError,
  ConflictError,
} = require("../lib/CustomErrors");

const getPhoneNumbers = async (req, res, next) => {
  try {
    const country = req.query.country;
    const allPhoneNumbers = await twilioService.getPhoneNumbers(country);
    const phoneNumbers = allPhoneNumbers.map((phoneNumber) => ({
      phoneNumber: phoneNumber.phone_number,
      friendlyName: phoneNumber.friendly_name,
    }));
    return responseHandler(res, { phoneNumbers: phoneNumbers });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const buyPhoneNumber = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const phoneNumber = req.body.phoneNumber;

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new NotFoundError("Property not found", {});
    }
    // Check if property exists
    const twilioAccount = await TwilioAccount.findOne({
      propertyId: propertyId,
    });
    if (!twilioAccount) {
      throw new NotFoundError("Twilio Account not found", {});
    }
    // Check if Twilio Account already has a phone number
    if (twilioAccount.phoneNumber) {
      throw new ConflictError("Twilio Account already has a phone number", {
        phoneNumber: ["Twilio Account already has a phone number"],
      });
    }
    const result = z
      .object({
        phoneNumber: z.string().refine((val) => phoneregex.test(val), {
          message: "Invalid phone number format",
        }),
      })
      .safeParse({ phoneNumber });
    if (!result.success) {
      throw new ValidationError(
        "Validation Error",
        result.error.flatten().fieldErrors
      );
    }
    const boughtPhoneNumber = await twilioService.buyPhoneNumber(
      propertyId,
      phoneNumber,
      req.user
    );

    return responseHandler(res, {}, 201, "Successfully bought phonenumber");
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const createSubaccount = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      throw new BadRequestError("Property ID is required", {
        propertyId: ["Property ID is required"],
      });
    }
    const subaccount = await twilioService.createSubaccount(propertyId);
    return responseHandler(
      res,
      { subaccount },
      201,
      "Twilio subaccount Created"
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

const getTollFreeVerificationStatus = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;

    const tollFreeVerificationStatus =
      await twilioService.getTollFreeVerificationStatus(propertyId);

    return responseHandler(res, { tollFreeVerificationStatus });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError());
  }
};

module.exports = {
  getPhoneNumbers,
  buyPhoneNumber,
  createSubaccount,
  getTollFreeVerificationStatus,
};
