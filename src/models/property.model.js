const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    name: { type: String, required: true },
    businessSummary: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    active: { type: Boolean, required: true },
    website: { type: String, required: true },
  },
  { timestamps: true }
);

const PropertyValidationSchema = z.object({
  name: z.string().min(3).max(255),
  businessSummary: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  phoneNumber: z.string().min(10).max(10),
  email: z.string().email(),
  active: z.boolean(),
  website: z.string().url(),
});

const Property = mongoose.model("Property", propertySchema);
Property.init().then(() => {
  console.log("Initialzed Property Model");
});
module.exports = { Property, PropertyValidationSchema };
