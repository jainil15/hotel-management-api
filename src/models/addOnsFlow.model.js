const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const addOnsFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    customEarlyCheckInTimeEnabled: { type: Boolean, default: false },
    customEarlyCheckInTime: { type: String },
    customLateCheckOutTimeEnabled: { type: Boolean, default: false },
    customLateCheckOutTime: { type: String },
  },
  { timestamps: true },
);

addOnsFlowSchema.index({ propertyId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<AddOnsFlow>} AddOnsFlow
 * @typedef {typeof AddOnsFlow.schema.obj} AddOnsFlowType
 */
const AddOnsFlow = mongoose.model("AddOnsFlow", addOnsFlowSchema);

const CreateAddOnsFlowValidationSchema = z.object({
  customEarlyCheckInTimeEnabled: z.boolean().optional(),
  customEarlyCheckInTime: z
    .string()
    .optional()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    }),
  customLateCheckOutTimeEnabled: z.boolean().optional(),
  customLateCheckOutTime: z
    .string()
    .optional()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    }),
});

const UpdateAddOnsFlowValidationSchema = z.object({
  customEarlyCheckInTimeEnabled: z.boolean().optional(),
  customEarlyCheckInTime: z
    .string()
    .optional()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    }),
  customLateCheckOutTimeEnabled: z.boolean().optional(),
  customLateCheckOutTime: z
    .string()
    .optional()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    }),
});

AddOnsFlow.init().then(() => {
  logger.info("Initialized AddOnsFlow Model");
});

module.exports = {
  AddOnsFlow,
  CreateAddOnsFlowValidationSchema,
  UpdateAddOnsFlowValidationSchema,
};
