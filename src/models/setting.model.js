const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");
const { timeregex, timezoneregex } = require("../constants/regex.constant");
const logger = require("../configs/winston.config");

const settingSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, required: true },
    timezone: { type: String, required: true },
    standardCheckinTime: { type: String, required: true },
    standardCheckoutTime: { type: String, required: true },
    automaticNewDay: { type: Boolean, default: true },
    defaultNewDayTime: { type: String, required: true },
    manualNewDay: { type: Date },
  },
  { timestamps: true },
);
settingSchema.index({ propertyId: 1 }, { unique: true });
const SettingValidationSchema = z.object({
  timezone: z.string(),
  standardCheckinTime: z.string().refine((val) => timeregex.test(val), {
    message: "Invalid time format",
  }),
  standardCheckoutTime: z.string().refine((val) => timeregex.test(val), {
    message: "Invalid time format",
  }),
  automaticNewDay: z.boolean().optional(),
  defaultNewDayTime: z.string().refine((val) => timeregex.test(val), {
    message: "Invalid time format",
  }),
  manualNewDay: z.date().optional(),
});
const UpdateSettingValidationSchema = z.object({
  timezone: z.string().optional(),
  standardCheckinTime: z
    .string()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    })
    .optional(),
  standardCheckoutTime: z
    .string()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    })
    .optional(),
  automaticNewDay: z.boolean().optional(),
  defaultNewDayTime: z
    .string()
    .refine((val) => timeregex.test(val), {
      message: "Invalid time format",
    })
    .optional(),
  manualNewDay: z.date().optional(),
});
/**
 * @typedef {import("mongoose").Model<Setting>} Setting
 * @typedef {typeof Setting.schema.obj} SettingType
 */
const Setting = mongoose.model("Setting", settingSchema);
Setting.init().then(() => {
  logger.info("Initialized Setting Model");
});
module.exports = {
  Setting,
  SettingValidationSchema,
  UpdateSettingValidationSchema,
};
