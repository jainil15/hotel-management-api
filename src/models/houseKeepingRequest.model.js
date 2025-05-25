const mongoose = require("mongoose");
const { z } = require("zod");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const Schema = mongoose.Schema;
const logger = require("../configs/winston.config");

const houseKeepingRequestSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    requestStatus: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      required: true,
    },
    options: { type: [String], default: [] },
    requestType: { type: String, default: "houseKeeping" },
    reason: { type: String },
  },
  { timestamps: true },
);

const CreateHouseKeepingRequestValidationSchema = z.object({
  name: z.string(),
  description: z.string(),
  options: z.array(z.string()),
});
const UpdateHouseKeepingRequestValidationSchema = z.object({
  requestStatus: z.string(),
});

/**
 * @typedef {import("mongoose").Model<HouseKeepingRequest>}  HouseKeepingRequest
 * @typedef {typeof HouseKeepingRequest.schema.obj} HouseKeepingRequestType
 */
const HouseKeepingRequest = mongoose.model(
  "houseKeepingRequest",
  houseKeepingRequestSchema,
);

HouseKeepingRequest.init().then(() => {
  logger.info("Initialized HouseKeepingRequest Model");
});
module.exports = {
  HouseKeepingRequest,
  CreateHouseKeepingRequestValidationSchema,
  UpdateHouseKeepingRequestValidationSchema,
};
