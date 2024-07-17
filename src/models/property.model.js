const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    website: { type: String, required: true },
    about: { type: String, required: true },

    logoUrl: { type: String },
    coverUrl: { type: String },

    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },

    countryCode: { type: String, required: true },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PropertyValidationSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  phoneNumber: z.string().min(10).max(10),
  website: z.string().url(),
  about: z.string().min(3),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(3),
  countryCode: z.string().min(1),
});

const Property = mongoose.model("Property", propertySchema);
Property.init().then(() => {
  console.log("Initialzed Property Model");
});
module.exports = { Property, PropertyValidationSchema };
