const mongoose = require("mongoose");
const { z } = require("zod");
const {
	datetimeregex,
	nocountrycodephoneregex,
	countrycoderegex,
} = require("../constants/regex.constant");
const logger = require("../configs/winston.config");
const {
	EARLY_CHECK_IN_STATUS,
	LATE_CHECK_OUT_STATUS,
	PRE_ARRIVAL_STATUS,
	RESERVATION_STATUS,
	GUEST_CURRENT_STATUS,
} = require("../constants/guestStatus.contant");
const { CreateGuestStatusValidationSchema } = require("./guestStatus.model");
const Schema = mongoose.Schema;

/**
 * Guest Schema
 * @class Guest
 */
const guestSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		countryCode: { type: String, required: true },
		phoneNumber: { type: String, required: true },
		source: { type: String, required: true },
		checkIn: { type: Date, required: true },
		checkOut: { type: Date, required: true },
		confirmationNumber: { type: String, required: true },
		roomNumber: { type: String },
		firstName: { type: String },
		lastName: { type: String },
		email: { type: String },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

const Guest = mongoose.model("Guest", guestSchema);

const GuestValidationScehma = z.object({
	propertyId: z.string(),
	phoneNumber: z.string().refine((val) => nocountrycodephoneregex.test(val), {
		message: "Invalid phone number format",
	}),
	countryCode: z.string().refine((val) => countrycoderegex.test(val), {
		message: "Invalid country code format",
	}),
	source: z.string().optional(),
	checkIn: z
		.string()
		.refine((val) => datetimeregex.test(val) && isNaN(new Date(val).getTime), {
			message: "Invalid date format",
		}),
	checkOut: z
		.string()
		.refine((val) => datetimeregex.test(val) && isNaN(new Date(val).getTime), {
			message: "Invalid date format",
		}),
	confirmationNumber: z.string().min(3).max(255),
	roomNumber: z.string().optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	email: z.string().email().optional(),
	active: z.boolean().optional(),
});

const CreateGuestValidationSchema = z
	.object({
		phoneNumber: z.string().refine((val) => nocountrycodephoneregex.test(val), {
			message: "Invalid phone number format",
		}),
		countryCode: z.string().refine((val) => countrycoderegex.test(val), {
			message: "Invalid country code format",
		}),
		source: z.string(),
		checkIn: z
			.string()
			.refine(
				(val) => datetimeregex.test(val) && isNaN(new Date(val).getTime),
				{
					message: "Invalid date format",
				},
			),
		checkOut: z
			.string()
			.refine(
				(val) => datetimeregex.test(val) && isNaN(new Date(val).getTime),
				{
					message: "Invalid date format",
				},
			),
		confirmationNumber: z.string().min(3).max(255),
		roomNumber: z.string().optional(),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		email: z.string().email().optional(),
		active: z.boolean().optional(),
	})
	.superRefine((args, ctx) => {
		if (new Date(args.checkIn) >= new Date(args.checkOut)) {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
				path: ["checkIn"],
				fatal: true,
				message: "chekin date time should be before checkout date time",
			});
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
				path: ["checkOut"],
				fatal: true,
				message: "checkout date time should be after checkin date time",
			});
		}
	});

const UpdateGuestValidationSchema = z
	.object({
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
		source: z.string().optional(),
		checkIn: z
			.string()
			.refine(
				(val) => datetimeregex.test(val) && isNaN(new Date(val).getTime),
				{
					message: "Invalid date format",
				},
			)
			.optional(),
		checkOut: z
			.string()
			.refine(
				(val) => datetimeregex.test(val) && isNaN(new Date(val).getTime),
				{
					message: "Invalid date format",
				},
			)
			.optional(),
		confirmationNumber: z.string().min(3).max(255).optional(),
		roomNumber: z.string().min(3).max(255).optional(),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		email: z.string().email().optional(),
		active: z.boolean().optional(),
	})
	.superRefine((args, ctx) => {
		if (new Date(args.checkIn) >= new Date(args.checkOut)) {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
				path: ["checkIn"],
				fatal: true,
				message: "chekin date time should be before checkout date time",
			});
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
				path: ["checkOut"],
				fatal: true,
				message: "checkout date time should be after checkin date time",
			});
		}
	});
Guest.init().then(() => {
	logger.info("Initialized Guest Model");
});
module.exports = {
	Guest,
	GuestValidationScehma,
	CreateGuestValidationSchema,
	UpdateGuestValidationSchema,
};
