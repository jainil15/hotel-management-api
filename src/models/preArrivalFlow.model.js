const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");

const Schema = mongoose.Schema;

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

preArrivalFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<PreArrivalFlow>} PreArrivalFlow
 * @typedef {typeof PreArrivalFlow.schema.obj} PreArrivalFlowType
 */
const PreArrivalFlow = mongoose.model("PreArrivalFlow", preArrivalFlowSchema);

const UpdatePreArrivalValidationSchema = z.object({
  phoneNumber: z.boolean().optional(),
  emailAddress: z.boolean().optional(),
  arrivalTime: z.boolean().optional(),
  vehicleMakeModelColor: z.boolean().optional(),
  licensePlateNo: z.boolean().optional(),
  specialRequests: z.boolean().optional(),
  guestSignature: z.boolean().optional(),
  guestIdProof: z.boolean().optional(),
  policies: z.boolean().optional(),
  primaryPolicy: z.string().optional(),
  policyLink: z.string().optional(),
  extraPolicies: z.array(z.string()).optional(),
});

PreArrivalFlow.init().then(() => {
  logger.info("Initialized PreArrivalFlow Model");
});

module.exports = { PreArrivalFlow, UpdatePreArrivalValidationSchema };
