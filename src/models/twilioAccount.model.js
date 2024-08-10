const mongoose = require("mongoose");
const { z } = require("zod");
const {
  nocountrycodephoneregex,
  countrycoderegex,
} = require("../constants/regex.constant");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const twilioAccountSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, required: true },
    sid: { type: String, required: true },
    authToken: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    dateUpdated: { type: Date, required: true },
    friendlyName: { type: String, required: true },
    ownerAccountSid: { type: String, required: true },
    status: { type: String, required: true },
    phoneNumber: { type: String },
    countryCode: { type: String },
    phoneNumberSid: { type: String },
    tollfreeVerificationSid: { type: String },
  },
  { timestamps: true },
);
const TwilioValidationSchema = z.object({
  propertyId: z.string(),
  sid: z.string(),
  authToken: z.string(),
  dateCreated: z.string(),
  dateUpdated: z.string(),
  friendlyName: z.string(),
  ownerAccountSid: z.string(),
  status: z.string(),
  phoneNumber: z
    .string()
    .refine((val) => nocountrycodephoneregex.test(val), {
      message: "Invalid phone number format",
    })
    .optional(),
  countryCode: z
    .string()
    .refine((val) => countrycoderegex.test(val), {
      message: "Invalid country code format",
    })
    .optional(),
  phoneNumberSid: z.string().optional(),
});

/**
 * @typedef {import("mongoose").Model<TwilioAccount>} TwilioAccount
 * @typedef {typeof TwilioAccount.schema.obj} TwilioAccountType
 */
const TwilioAccount = mongoose.model("TwilioAccount", twilioAccountSchema);
TwilioAccount.init().then(() => {
  logger.info("Initialized TwilioAccount Model");
});
module.exports = { TwilioAccount };
