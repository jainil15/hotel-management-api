const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const { phoneregex, datetimeregex } = require("../constants/regex.constant");
const { MAX_FILE_SIZE } = require("../constants/file.constant");
const Schema = mongoose.Schema;
/**
const preArrivalFlowSchema = new Schema(
  {
    propertyId: {
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
    guestSignature: { type: Boolean, default: true },
    guestIdProof: { type: Boolean, default: true },
    policies: { type: Boolean, default: true },
    primaryPolicy: {
      type: String,
      default:
        "Primary policy regarding refund and important points displayed here",
    },
    policyLink: { type: String, default: "Policy link with bottom sheet" },
    extraPolicies: { type: [String], default: [] },
  },
  { timestamps: true },
);
 */
const preArrivalSchema = new Schema(
  {
    guestId: {
      type: Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    phoneNumber: { type: String },
    emailAddress: { type: String },
    arrivalTime: { type: Date },
    vehicleMakeModelColor: { type: String },
    licensePlateNo: { type: String },
    specialRequests: { type: String },
    guestSignatureUrl: { type: String },
    guestIdProofUrl: { type: String },
    policyAccepted: { type: Boolean },
    consentToText: { type: Boolean },
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
  guestSignature: z
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
  guestIdProof: z
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
  policyAccepted: z.boolean().optional(),
  consentToText: z.boolean().optional(),
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
