const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { z } = require("zod");
const { timeregex, timezoneregex } = require("../constants/regex.constant");

const settingSchema = new Schema(
	{
		propertyId: { type: Schema.Types.ObjectId, required: true },
		timezone: { type: String, required: true },
		standardCheckinTime: { type: String, required: true },
		standardCheckoutTime: { type: String, required: true },
		automaticNewDay: { type: Boolean, default: true },
		defaultNewDayTime: { type: String, required: true },
		manualNewDay: { type: Date },
		automateMessageOnStatusUpdate: { type: Boolean },
		automateEarlyCheckinMessage: { type: String },
		automateLateCheckoutMessage: { type: String },
	},
	{ timeseries: true },
);

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
	automateMessageOnStatusUpdate: z.boolean().optional(),
	automateEarlyCheckinMessage: z.string().optional(),
	automateLateCheckoutMessage: z.string().optional(),
});

/**
 * @typedef {import("mongoose").Model<Setting>} Setting
 * @typedef {typeof Setting.schema.obj} SettingType
 */
const Setting = mongoose.model("Setting", settingSchema);

module.exports = { Setting, SettingValidationSchema };
