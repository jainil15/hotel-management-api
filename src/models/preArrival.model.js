const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const { phoneregex, datetimeregex } = require("../constants/regex.constant");
const Schema = mongoose.Schema;
/**
 * propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  phoneNumber: { type: Boolean, default: true },
  emailAddress: { type: Boolean, default: true },
  arrivalTime: { type: Boolean, default: true },
  vehicleMakeModelColor: { type: Boolean, default: true },
  licensePlateNo: { type: Boolean, default: true },
  specialRequests: { type: Boolean, default: true },
  policies: { type: Boolean, default: true },
  policyLink: { type: String, default: "https://www.onelyk.com/privacy" },
  extraPolicies: [{ type: String }],
 */
const preArrivalSchema = new Schema(
  {
    guestId: { type: String, required: true },
    propertyId: { type: String, required: true },
    phoneNumber: { type: String },
    emailAddress: { type: String },
    arrivalTime: { type: Date },
    vehicleMakeModelColor: { type: String },
    licensePlateNo: { type: String },
    specialRequests: { type: String },
    policyAccepted: { type: Boolean, required: true },
    signatureImgUrl: { type: String },
    consentToText: { type: Boolean, required: true },
  },
  { timestamps: true },
);
preArrivalSchema.index({ guestId: 1 }, { unique: true });

const CreatePreArrivalValidationSchema = z.object({
  phoneNumber: z
    .string()
    .refine((val) => phoneregex.test(val), {
      message: "Invalid phone number format",
    })
    .optional(),
  emailAddress: z.string().email().optional(),
  arrivalTime: z
    .string()
    .refine(
      (val) => datetimeregex.test(val) && !Number.isNaN(Date.parse(val)),
      {
        message: "Invalid date format",
      },
    )
    .optional(),
  vehicleMakeModelColor: z.string().optional(),
  licensePlateNo: z.string().optional(),
  specialRequests: z.string().optional(),
  policyAccepted: z.boolean().optional(),
  consentToText: z.boolean().optional(),
  signatureImg: z
    .array(
      z
        .any()
        .refine((val) => val.size < MAX_FILE_SIZE, {
          message: "File size too large",
        })
        .refine((val) => checkImageType(val.mimetype), {
          message: "Invalid file type",
        }),
    )
    .length(1),
});

/**
 * @typedef {import("mongoose").Model<PreArrival>} PreArrival
 * @typedef {typeof PreArrival.schema.obj} PreArrivalType
 */
const PreArrival = mongoose.model("PreArrival", preArrivalSchema);
PreArrival.init().then(() => {
  logger.info("Initialized PreArrival model ");
});
module.exports = { PreArrival, CreatePreArrivalValidationSchema };
