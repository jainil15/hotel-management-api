const { default: mongoose } = require("mongoose");
const { z } = require("zod");
const { REQUEST_STATUS } = require("../constants/guestStatus.contant");
const Schema = mongoose.Schema;

const addOnsRequestSchema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
  guestId: { type: Schema.Types.ObjectId, ref: "Guest" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  paid: { type: Boolean, required: true },
  requestStatus: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.REQUESTED,
  },
});

const CreateAddOnsRequestValidationSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  paid: z.boolean(),
});

/**
 * @typedef {import("mongoose").Model<AddOnsRequest>} AddOnsRequest
 * @typedef {typeof AddOnsRequest.schema.obj} AddOnsRequestType
 */
const AddOnsRequest = mongoose.model("AddOnsRequest", addOnsRequestSchema);

module.exports = { AddOnsRequest, CreateAddOnsRequestValidationSchema };
