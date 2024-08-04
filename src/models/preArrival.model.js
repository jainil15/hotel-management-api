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
    // TODO: What is the type of arrivalTime? Is it checkin time?
    arrivalTime: { type: Date, required: true },
    vehicleType: { type: String, required: true },
    licensePlate: { type: String, required: true },
    specialRequests: { type: String },
    
    signatureImgUrl: { type: String, required: true },
  },
  { timestamps: true }
);
preArrivalSchema.index({ guestId: 1 }, { unique: true });


const PreArrival = mongoose.model("PreArrival", preArrivalSchema);
PreArrival.init(() => {
  logger.info("initialized PreArrival model ");
});
module.exports = { PreArrival };
