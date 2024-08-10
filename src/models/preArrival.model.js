const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const preArrivalSchema = new Schema(
	{
		guestId: { type: String, required: true },
		propertyId: { type: String, required: true },
		phoneNumber: { type: String, required: true },
		emailAddress: { type: String, required: true },

		arrivalTime: { type: Date, required: true },
		vehicleType: { type: String, required: true },
		licensePlate: { type: String, required: true },
		specialRequests: { type: String },

		signatureImgUrl: { type: String, required: true },
	},
	{ timestamps: true },
);
preArrivalSchema.index({ guestId: 1 }, { unique: true });

const PreArrival = mongoose.model("PreArrival", preArrivalSchema);
PreArrival.init().then(() => {
	logger.info("Initialized PreArrival model ");
});
module.exports = { PreArrival };
