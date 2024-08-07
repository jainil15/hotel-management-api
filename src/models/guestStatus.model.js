const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;
const logger = require("../configs/winston.config");
const {
	LATE_CHECK_OUT_STATUS,
	EARLY_CHECK_IN_STATUS,
	RESERVATION_STATUS,
	GUEST_CURRENT_STATUS,
	PRE_ARRIVAL_STATUS,
} = require("../constants/guestStatus.contant");
const { dateValidation } = require("../utils/dateCompare");

const guestStatusSchema = new Schema(
	{
		propertyId: {
			type: Schema.Types.ObjectId,
			ref: "Property",
			required: true,
		},
		guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
		currentStatus: {
			type: String,
			enum: Object.values(GUEST_CURRENT_STATUS),
			required: true,
		},
		lateCheckOutStatus: {
			type: String,
			enum: Object.values(EARLY_CHECK_IN_STATUS),
			default: EARLY_CHECK_IN_STATUS.NOT_REQUESTED,
		},
		earlyCheckInStatus: {
			type: String,
			enum: Object.values(LATE_CHECK_OUT_STATUS),
			default: EARLY_CHECK_IN_STATUS.NOT_REQUESTED,
		},
		reservationStatus: {
			type: String,
			enum: Object.values(RESERVATION_STATUS),
			default: RESERVATION_STATUS.CONFIRMED,
		},
		preArrivalStatus: {
			type: String,
			enum: Object.values(PRE_ARRIVAL_STATUS),
			default: PRE_ARRIVAL_STATUS.NOT_APPLIED,
		},
		// flag: { type: Boolean, required: true, default: false },
	},
	{ timestamps: true },
);

guestStatusSchema.index({ guestId: 1 }, { unique: true });

const GuestStatusValidationSchema = z.object({
	propertyId: z.string(),
	guestId: z.string(),
	currentStatus: z.enum(Object.values(GUEST_CURRENT_STATUS)),
});
const CreateGuestStatusValidationSchema = z.object({
	currentStatus: z.enum(Object.values(GUEST_CURRENT_STATUS)),
	earlyCheckInStatus: z.enum(Object.values(EARLY_CHECK_IN_STATUS)).optional(),
	lateCheckOutStatus: z.enum(Object.values(LATE_CHECK_OUT_STATUS)).optional(),
	preArrivalStatus: z.enum(Object.values(PRE_ARRIVAL_STATUS)).optional(),
	reservationStatus: z.enum(Object.values(RESERVATION_STATUS)).optional(),
});
const UpdateGuestStatusValidationSchema = z.object({
	currentStatus: z.enum(Object.values(GUEST_CURRENT_STATUS)).optional(),
	earlyCheckInStatus: z.enum(Object.values(EARLY_CHECK_IN_STATUS)).optional(),
	lateCheckOutStatus: z.enum(Object.values(LATE_CHECK_OUT_STATUS)).optional(),
	preArrivalStatus: z.enum(Object.values(PRE_ARRIVAL_STATUS)).optional(),
	reservationStatus: z.enum(Object.values(RESERVATION_STATUS)).optional(),
});

const GetGuestFiltersValidationSchema = z.object({
	checkIn: z
		.string()
		.refine((date) => dateValidation(date))
		.optional(),
	checkOut: z
		.string()
		.refine((date) => dateValidation(date))
		.optional(),
	currentStatus: z.enum(Object.values(GUEST_CURRENT_STATUS)).optional(),
	search: z.string().optional(),
});

const GuestStatus = mongoose.model("GuestStatus", guestStatusSchema);

/**
 * @typedef {import("mongoose").Model<GuestStatus>} GuestStatus
 * @typedef {typeof GuestStatus.schema.obj} GuestStatusType
 */

GuestStatus.init().then(() => {
	logger.info("Initialized Guest Status Model");
});

module.exports = {
	GuestStatus,
	GuestStatusValidationSchema,
	CreateGuestStatusValidationSchema,
	UpdateGuestStatusValidationSchema,
	GetGuestFiltersValidationSchema,
};
