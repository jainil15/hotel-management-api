const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;
const customAddOnsSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    paid: { type: Boolean, default: true },
    price: { type: Number },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
  },
  { _id: false },
);
const checkInOutAddOnsSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    defaultTimeEnabled: { type: Boolean, required: true },
    defaultTiming: { type: String },
    customTiming: { type: String, required: true },
    paid: { type: Boolean, required: true },
    price: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    default: { type: Boolean, default: true },
  },
  { _id: false },
);
const addOnsFlowSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    customAddOns: { type: [customAddOnsSchema], default: [] },
    checkInOutAddOns: {
      type: [checkInOutAddOnsSchema],
      default: [
        {
          name: "Early Check In",
          description: "Early Check In",
          defaultTimeEnabled: true,
          defaultTiming: "14:00",
          customTiming: "14:00",
          paid: false,
          price: 0,
          enabled: true,
          default: true,
        },
        {
          name: "Late Check Out",
          description: "Late Check Out",
          defaultTimeEnabled: true,
          defaultTiming: "12:00",
          customTiming: "12:00",
          paid: false,
          price: 0,
          enabled: true,
          default: true,
        },
      ],
    },
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
