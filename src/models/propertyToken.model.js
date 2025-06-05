const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const propertyTokenSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PropertyTokenValidationSchema = z.object({
  propertyId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  email: z.string().email(),
  expiryDate: z.date(),
});

const PropertyToken = mongoose.model("PropertyToken", propertyTokenSchema);

module.exports = {
  PropertyToken,
  PropertyTokenValidationSchema,
}; 