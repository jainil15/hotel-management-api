const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
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
		policyAcceptance: { type: Boolean, required: true },
		signatureImgUrl: { type: String },
	},
	{ timestamps: true },
);
preArrivalSchema.index({ guestId: 1 }, { unique: true });

/**
 * @typedef {import("mongoose").Model<PreArrival>} PreArrival
 * @typedef {typeof PreArrival.schema.obj} PreArrivalType
 */
const PreArrival = mongoose.model("PreArrival", preArrivalSchema);
PreArrival.init().then(() => {
	logger.info("Initialized PreArrival model ");
});
module.exports = { PreArrival };
