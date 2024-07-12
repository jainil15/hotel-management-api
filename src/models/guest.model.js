const mongoose = require("mongoose");
const { z } = require("zod");
const Schema = mongoose.Schema;

const datetimeregex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const guestSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    countryCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    source: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    confirmationNumber: { type: String, required: true },
    roomNumber: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
guestSchema.index({ propertyId: 1, phoneNumber: 1 }, { unique: true });
const Guest = mongoose.model("Guest", guestSchema);

const GuestValidationScehma = z.object({
  propertyId: z.string(),
  phoneNumber: z.string().min(10).max(10),
  countryCode: z.string().min(2).max(2),
  source: z.string(),
  checkIn: z
    .string()
    .refine((val) => datetimeregex.test(val) && isNaN(new Date(val).getTime), {
      message: "Invalid date format",
    }),
  checkOut: z
    .string()
    .refine((val) => datetimeregex.test(val) && isNaN(new Date(val).getTime), {
      message: "Invalid date format",
    }),
  confirmationNumber: z.string().min(3).max(255),
  roomNumber: z.string().min(3).max(255),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
});
Guest.init().then(() => {
  console.log("Initialzed Guest Model");
});
module.exports = { Guest, GuestValidationScehma };
