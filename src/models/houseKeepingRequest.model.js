const mongoose = require("mongoose");
const { z } = require("zod");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const Schema = mongoose.Schema;

const houseKeepingRequestSchema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
  guestId: { type: Schema.Types.ObjectId, ref: "Guest" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  requestStatus: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.REQUESTED,
  },
  requestType: { type: String, default: "houseKeeping" },
});

const CreateAddOnsRequestValidationSchema = z.object({
  name: z.string(),
  description: z.string(),
});
const UpdateAddOnsRequestValidationSchema = z.object({
  requestStatus: z.string(),
});

/**
 * @typedef {import("mongoose").Model<AddOnsRequest>} AddOnsRequest
 * @typedef {typeof AddOnsRequest.schema.obj} AddOnsRequestType
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
  CreateAddOnsRequestValidationSchema,
  UpdateAddOnsRequestValidationSchema,
};
