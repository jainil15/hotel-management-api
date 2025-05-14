const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const { PRE_ARRIVAL_INPUT } = require("../constants/preArrivalFlow.constant");
const Schema = mongoose.Schema;

const policySchema = new Schema({
  name: { type: String },
  description: { type: String },
  isMandatory: { type: Boolean, default: true },
});

const preArrivalFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    phoneNumber: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    emailAddress: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    arrivalTime: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    vehicleMakeModelColor: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    licensePlateNo: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    specialRequests: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.OPTIONAL,
    },
    guestSignature: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    guestIdProof: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    policies: {
      type: String,
      enum: Object.values(PRE_ARRIVAL_INPUT),
      default: PRE_ARRIVAL_INPUT.REQUIRED,
    },
    primaryPolicy: {
      type: String,
      default:
        "Primary policy regarding refund and important points displayed here",
    },
    policyLink: { type: String, default: "Policy link with bottom sheet" },
    extraPolicies: { type: [String], default: [] },
    propertyPolicies: [policySchema],
  },
  { timestamps: true },
);

preArrivalFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<PreArrivalFlow>} PreArrivalFlow
 * @typedef {typeof PreArrivalFlow.schema.obj} PreArrivalFlowType
 */
const PreArrivalFlow = mongoose.model("PreArrivalFlow", preArrivalFlowSchema);

const UpdatePreArrivalValidationSchema = z.object({
  phoneNumber: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  emailAddress: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  arrivalTime: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  vehicleMakeModelColor: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  licensePlateNo: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  specialRequests: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  guestSignature: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  guestIdProof: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  policies: z.enum(Object.values(PRE_ARRIVAL_INPUT)).optional(),
  primaryPolicy: z.string().optional(),
  policyLink: z.string().optional(),
  extraPolicies: z.array(z.string()).optional(),
  propertyPolicies: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isMandatory: z.boolean().optional(),
      }),
    )
    .optional(),
});

PreArrivalFlow.init().then(() => {
  logger.info("Initialized PreArrivalFlow Model");
});

module.exports = { PreArrivalFlow, UpdatePreArrivalValidationSchema };
