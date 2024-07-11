const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feauteAccessSchema = new Schema(
  {
    propertyAccessId: {
      type: Schema.Types.ObjectId,
      ref: "PropertyAccess",
      required: true,
    },
    features: [{ type: String, required: true }],
  },
  { timestamps: true }
);

const FeatureAccess = mongoose.model("FeatureAccess", feauteAccessSchema);
module.exports = FeatureAccess;
