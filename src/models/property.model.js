const e = require("cors");
const mongoose = require("mongoose");
const { z } = require("zod");
const {
  nocountrycodephoneregex,
  countrycoderegex,
} = require("../constants/regex.constant");
const checkImageType = require("../utils/checkType");
const { MAX_FILE_SIZE } = require("../constants/file.constant");
const logger = require("../configs/winston.config");
const { validateZipcode } = require("../utils/validateZipcode");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    website: { type: String, required: true },
    about: { type: String },

    logoUrl: { type: String },
    coverUrl: { type: String },

    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    zipcode: { type: String, required: true },
    countryCode: { type: String, required: true },

    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

propertySchema.index({ email: 1 }, { unique: true });

const PropertyValidationSchema = z
  .object({
    name: z.string().min(3).max(255),
    email: z.string().email(),
    phoneNumber: z.string().refine((val) => nocountrycodephoneregex.test(val), {
      message: "Invalid phone number format",
    }),
    countryCode: z.string().refine((val) => countrycoderegex.test(val), {
      message: "Invalid country code format",
    }),
    logo: z
      .array(
        z
          .any()
          .refine((val) => val.size < MAX_FILE_SIZE, {
            message: "File size too large",
          })
          .refine((val) => checkImageType(val.mimetype), {
            message: "Invalid file type",
          }),
      )
      .length(1),
    cover: z
      .array(
        z
          .any()
          .refine((val) => val.size < MAX_FILE_SIZE, {
            message: "File size too large",
          })
          .refine((val) => checkImageType(val.mimetype), {
            message: "Invalid file type",
          }),
      )
      .length(1),
    website: z.string().url(),
    about: z.string().min(1).optional(),
    country: z.string().min(1),
    state: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(3),
    zipcode: z.string().min(1),
  })
  .refine((val) => validateZipcode(val.country, val.state, val.zipcode), {
    path: ["zipcode"],
    message: "Invalid zipcode",
  });

/**
 * @typedef {import("mongoose").Model<Property>} Property
 * @typedef {typeof Property.schema.obj} PropertyType
 */
const Property = mongoose.model("Property", propertySchema);
Property.init().then(() => {
  logger.info("Initialized Property Model");
});
module.exports = { Property, PropertyValidationSchema };
