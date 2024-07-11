const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertyAccessSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

const PropertyAccess = mongoose.model("PropertyAccess", propertyAccessSchema);
module.exports = PropertyAccess;
