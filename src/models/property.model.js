const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    name: { type: String, required: true },
    businessSummary: { type: String, required: false },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    phone_number: { type: String, required: true },
    email: { type: String, required: true },
    active: { type: Boolean, required: true },
    website: { type: String, required: true },
  },
  { timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);
module.exports = Property;
