const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const featureSchema = new Schema(
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

const Feature = mongoose.model("Feature", featureSchema);
module.exports = Feature;
