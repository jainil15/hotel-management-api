const mongoose = require("mongoose");
const { z } = require("zod");
const logger = require("../configs/winston.config");
const Schema = mongoose.Schema;

const doNotDisturbRequest = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    requestStatus: {
      type: String,
      enum: ["requested", "not requested", "Accepted", "Declined", "unrequest"],
      default: "not requested",
    },
  },
  { timestamps: true },
);

const DoNotDisturbRequest = mongoose.model(
  "DoNotDisturbRequest",
  doNotDisturbRequest,
);

DoNotDisturbRequest.init().then(() => {
  logger.info("Initialized CheckInOutRequest model");
});

module.exports = {
  DoNotDisturbRequest,
};
